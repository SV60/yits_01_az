import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css';

SwiperCore.use([Autoplay]);

export default function Hero() {
    const [heroItems, setHeroItems] = useState([]);
    const [logoImages, setLogoImages] = useState({});
    const [videos, setVideos] = useState({});
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [loadedStates, setLoadedStates] = useState({});
    const [isMuted, setIsMuted] = useState({}); 
    const swiperRef = useRef(null); 

    const apiKey = import.meta.env.VITE_API_KEY;

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&append_to_response=release_dates&include_adult=false`);
                const data = await response.json();
                setHeroItems(data.results);

                const promises = data.results.map(async (movie) => {
                    const imagesResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${apiKey}`);
                    const imagesData = await imagesResponse.json();
                    const logo = imagesData.logos.find(logo => logo.iso_639_1 === "en")?.file_path;

                    if (logo) {
                        setLogoImages(prevState => ({ ...prevState, [movie.id]: logo }));
                    }

                    const videoResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${apiKey}`);
                    const videoData = await videoResponse.json();
                    const firstVideo = videoData.results.find(video => video.type === "Trailer")?.key;

                    setVideos(prevState => ({ ...prevState, [movie.id]: firstVideo }));
                    setLoadedStates(prevState => ({
                        ...prevState,
                        [movie.id]: {
                            isImageLoaded: false,
                            isVideoLoaded: !!firstVideo
                        }
                    }));
                });

                await Promise.all(promises);

            } catch (error) {
                console.error('Error fetching heroes:', error);
            }
        };

        fetchHeroes();

        const mediaQuery = window.matchMedia('(max-width: 1100px), (max-height: 600px)');
        const handleMediaChange = (e) => setIsSmallScreen(e.matches);

        handleMediaChange(mediaQuery);
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }, [apiKey]);

    const handleImageLoad = (movieId) => {
        setLoadedStates(prevState => ({
            ...prevState,
            [movieId]: { ...prevState[movieId], isImageLoaded: true }
        }));
    };

    const preloadNext = (swiper, n) => {
        const startIndex = swiper.activeIndex;
        const endIndex = startIndex + n + 1;
        swiper.slides.slice(startIndex, endIndex)
            .forEach(slide => {
                const iframe = slide.querySelector('iframe');
                iframe && iframe.setAttribute('loading', 'lazy');
            });
    };

    const handleSlideChange = (swiper) => {
        setIsMuted((prev) => {
            const updated = {};
            heroItems.forEach((item) => {
                updated[item.id] = true; 
            });
            return updated;
        });
        preloadNext(swiper, 2);
    };

    const updateAutoplayDelay = (swiper, delay) => {
        if (swiper && swiper.autoplay) {
            swiper.autoplay.stop();
            swiper.params.autoplay.delay = delay;
            swiper.autoplay.start();
        }
    };

    const handleMuteToggle = (movieId) => {
        setIsMuted((prev) => {
            const newMutedState = { ...prev, [movieId]: !prev[movieId] };

            const isAnyUnmuted = Object.values(newMutedState).some(muted => !muted);
            const newDelay = isAnyUnmuted ? 300000 : 15000; 

            if (swiperRef.current) {
                updateAutoplayDelay(swiperRef.current, newDelay);
            }

            return newMutedState;
        });
    };

    return (
        <Swiper
            ref={swiperRef}
            centeredSlides={true}
            autoplay={{ delay: 15000, disableOnInteraction: false }}
            loop={heroItems.length > 1}
            onSlideChange={handleSlideChange}
            onInit={(swiper) => {
                swiperRef.current = swiper;
                preloadNext(swiper, 2);
            }}
        >
            {heroItems.map((heroItem) => (
                <SwiperSlide key={heroItem.id}>
                    <div className='flex h-screen max-lg:h-[90vh] [@media(max-height:500px)]:h-[102vh]'>
                        <div
                            style={{
                                backgroundImage: `url(https://image.tmdb.org/t/p/original${heroItem.backdrop_path})`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                            }}
                            className='absolute w-screen h-screen overflow-hidden z-[-1] opacity-40'
                        >
                            {!isSmallScreen && loadedStates[heroItem.id]?.isVideoLoaded && (
                                <iframe
                                    src={`https://www.youtube.com/embed/${videos[heroItem.id]}?mute=${isMuted[heroItem.id] ? 1 : 0}&autoplay=1&loop=1&rel=0&fs=0&controls=0&disablekb=1&playlist=${videos[heroItem.id]}&origin=https://mclod.vercel.app/`}
                                    title={heroItem.title}
                                    allowFullScreen
                                    loading="lazy"
                                    className={`absolute w-[150vw] h-[200vh] top-[-50%] left-[-25%] object-cover border-none transition-opacity duration-500 ease-in ${loadedStates[heroItem.id]?.isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => handleImageLoad(heroItem.id)}
                                />
                            )}
                        </div>
                        <div className='flex flex-col justify-end mb-[22vh]'>
                            <div className='flex flex-col ml-12 z-[1] gap-1 max-lg:mx-4 max-2xl:mx-6'>
                                <div className='flex text-[4rem] font-semibold mb-3 max-lg:justify-center max-lg:text-[3rem]'>
                                    <img 
                                        src={logoImages[heroItem.id] && `https://image.tmdb.org/t/p/w500${logoImages[heroItem.id]}`} 
                                        className='max-w-[60vw] max-h-[30vh] max-lg:max-w-[90vw] max-md:max-w-full'
                                        alt={heroItem.title} 
                                    />
                                </div>
                                <div className='flex gap-2 mt-2 max-lg:justify-center'>
                                    <button 
                                        onClick={() => handleMuteToggle(heroItem.id)} 
                                        className='flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xl font-bold border-none transition-all duration-150 hover:bg-opacity-50 max-[1100px]:hidden'
                                    >
                                        <i className={`fa-solid ${isMuted[heroItem.id] ? 'fa-volume-xmark' : 'fa-volume-high'} text-black text-xl`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}
