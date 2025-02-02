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

    const apiKey = import.meta.env.VITE_API_KEY;

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const movieResponse = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&include_adult=false`);
                const movieData = await movieResponse.json();
                
                const seriesResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&include_adult=false`);
                const seriesData = await seriesResponse.json();
                
                let combinedItems = [...movieData.results, ...seriesData.results];
                combinedItems = combinedItems.sort(() => Math.random() - 0.5);
                setHeroItems(combinedItems);

                const promises = combinedItems.map(async (item) => {
                    const type = item.title ? 'movie' : 'tv';
                    const imagesResponse = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}/images?api_key=${apiKey}`);
                    const imagesData = await imagesResponse.json();
                    const logo = imagesData.logos.find(logo => logo.iso_639_1 === "en")?.file_path;
                    
                    if (logo) {
                        setLogoImages(prevState => ({ ...prevState, [item.id]: logo }));
                    }

                    const videoResponse = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}/videos?api_key=${apiKey}`);
                    const videoData = await videoResponse.json();
                    const firstVideo = videoData.results.find(video => video.type === "Trailer")?.key;

                    setVideos(prevState => ({ ...prevState, [item.id]: firstVideo }));
                    setLoadedStates(prevState => ({
                        ...prevState,
                        [item.id]: {
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

    return (
        <Swiper
            centeredSlides={true}
            autoplay={{ delay: 15000, disableOnInteraction: false }}
            loop={heroItems.length > 1}
        >
            {heroItems.map((item) => (
                <SwiperSlide key={item.id}>
                    <div className='flex h-screen max-lg:h-[90vh]'>
                        <div
                            style={{
                                backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`,
                            }}
                            className='absolute w-screen h-screen overflow-hidden opacity-40'
                        ></div>
                        <div className='flex flex-col justify-end mb-[22vh]'>
                            <div className='flex flex-col ml-12 z-[1] gap-1'>
                                <div className='flex text-[4rem] font-semibold mb-3'>
                                    <span>{item.title || item.name}</span>
                                </div>
                                <div className='flex gap-2'>
                                    <Link to={`/watch/${item.title ? 'movie' : 'tv'}/${item.id}`} className='bg-white px-4 py-2 rounded-lg text-xl font-bold'>
                                        Watch
                                    </Link>
                                    <Link to={`/info/${item.title ? 'movie' : 'tv'}/${item.id}`} className='bg-white/20 px-4 py-2 rounded-lg text-xl font-bold'>
                                        Info
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}
