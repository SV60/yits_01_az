import { useState, useEffect } from 'react';
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
    const [autoplayDelay, setAutoplayDelay] = useState(15000); // Tiempo inicial del autoplay

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

    const handleMuteToggle = (movieId) => {
        setIsMuted((prev) => {
            const updatedMutedState = { ...prev, [movieId]: !prev[movieId] };

            // Si el video se desmutea, se cambia el delay del slider a 5 minutos
            setAutoplayDelay(updatedMutedState[movieId] ? 15000 : 300000); // 300000 ms = 5 minutos

            return updatedMutedState;
        });
    };

    const swiperParams = {
        centeredSlides: true,
        autoplay: {
            delay: autoplayDelay, // Se actualiza dinámicamente
            disableOnInteraction: false
        },
        loop: heroItems.length > 1,
    };

    return (
        <Swiper {...swiperParams}>
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
                                    src={`https://www.youtube.com/embed/${videos[heroItem.id]}?mute=${isMuted[heroItem.id] ? 1 : 0}&autoplay=1&loop=1&rel=0&fs=0&controls=0&disablekb=1&playlist=${videos[heroItem.id]}`}
                                    title={heroItem.title}
                                    allowFullScreen
                                    loading="lazy"
                                    className={`absolute w-[150vw] h-[200vh] top-[-50%] left-[-25%] object-cover border-none transition-opacity duration-500 ease-in ${loadedStates[heroItem.id]?.isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                />
                            )}
                        </div>
                        <div className='flex flex-col justify-end mb-[22vh]'>
                            <div className='flex flex-col ml-12 z-[1] gap-1 max-lg:mx-4 max-2xl:mx-6'>
                                <div className='flex text-[4rem] font-semibold mb-3 max-lg:justify-center max-lg:text-[3rem] [@media(max-height:500px)]:mb-0'>
                                    <span className="alt-text hidden line-clamp-2 text-center [@media(max-height:500px)]:block">
                                        {heroItem.title}
                                    </span>
                                    <img 
                                        src={logoImages[heroItem.id] && `https://image.tmdb.org/t/p/w500${logoImages[heroItem.id]}`} 
                                        className='max-w-[60vw] max-h-[30vh] max-lg:max-w-[90vw] max-md:max-w-full [@media(max-height:500px)]:hidden'
                                        alt={heroItem.title} 
                                    />
                                </div>
                                <div className='flex gap-2 mt-2 max-lg:justify-center'>
                                    <Link to={`/watch/movie/${heroItem.id}`} className='flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xl font-bold border-none transition-all duration-150 hover:bg-opacity-50'>
                                        <i className="fa-solid fa-play text-black text-xl" /><p className='text-black'>Watch</p>
                                    </Link>
                                    <Link to={`/info/movie/${heroItem.id}`} className='flex items-center gap-[10px] px-4 py-2 bg-white/20 rounded-lg text-xl font-bold border-none transition-all duration-150 hover:bg-opacity-40'>
                                        <i className="fa-regular fa-circle-info text-xl" /><p>Info</p>
                                    </Link>
                                    {/* Botón de muteo/desmuteo con visibilidad condicional */}
                                    {!isSmallScreen && (
                                        <button 
                                            onClick={() => handleMuteToggle(heroItem.id)} 
                                            className='flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xl font-bold border-none transition-all duration-150 hover:bg-opacity-50'
                                        >
                                            <i className={`fa-solid ${isMuted[heroItem.id] ? 'fa-volume-xmark' : 'fa-volume-high'} text-black text-xl`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}
