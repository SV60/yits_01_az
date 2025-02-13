import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

WideCard.propTypes = {
  item: PropTypes.object.isRequired, // Asegúrate de que 'item' sea un objeto
  onRemove: PropTypes.func.isRequired, // 'onRemove' debería ser una función
};

export default function WideCard(props) {
  // Función para remover un ítem del "Continue Watching"
  const removeItem = (event, id) => {
    event.preventDefault();
    
    // Recuperamos el array de "continueWatching" del localStorage, o un array vacío si no existe
    const storedContinueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];
    
    // Filtramos el array para eliminar el ítem con el id proporcionado
    const updatedContinueWatching = storedContinueWatching.filter(item => item.id !== id);
    
    // Guardamos el array actualizado de nuevo en localStorage
    localStorage.setItem('continueWatching', JSON.stringify(updatedContinueWatching));
    
    // Llamamos la función que pasaste a través de las props para manejar la remoción
    props.onRemove(id);
  };

  // Guardar película en el localStorage (sin season ni episode)
  const saveMovie = (movie) => {
    const storedContinueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];
    storedContinueWatching.push({
      id: movie.id,
      type: 'movie', // Tipo 'movie' para diferenciarlo de las series
      item: movie, // Guardamos el objeto de la película
    });
    localStorage.setItem('continueWatching', JSON.stringify(storedContinueWatching));
  };

  // Guardar serie en el localStorage (con season y episode)
  const saveTVShow = (tvShow) => {
    const storedContinueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];
    storedContinueWatching.push({
      id: tvShow.id,
      type: 'tv', // Tipo 'tv' para identificar que es una serie
      season: tvShow.season,
      episode: tvShow.episode,
      item: tvShow.item, // Guardamos el objeto de la serie
    });
    localStorage.setItem('continueWatching', JSON.stringify(storedContinueWatching));
  };

  return (
    <Link to={`/info/${props.item.type}/${props.item.item.id}`} className="widecard flex relative w-full h-full overflow-hidden rounded-lg group">
      <img
        className="widecard-image group-hover:scale-105 w-[21.5vw] max-2xl:w-[29vw] max-xl:w-[43.2vw] max-md:w-full h-full object-cover transition-all duration-150"
        src={props.item.item.backdrop_path && `https://image.tmdb.org/t/p/w500/${props.item.item.backdrop_path}`}
        alt="Backdrop"
      />
      <div className="widecard-content group flex justify-start items-end absolute w-full h-full bottom-0 left-0 bg-gradient-to-t from-black">
        <button
          className="flex justify-center items-center absolute top-1 right-1 opacity-0 w-9 h-9 bg-white/90 border-0 p-0 rounded-lg cursor-pointer transition-all duration-150 group-hover:opacity-100 max-2xl:opacity-100 hover:bg-red-500"
          onClick={(event) => removeItem(event, props.item.id)}
        >
          <i className="fa-light fa-trash-can text-lg text-black" alt="Remove" />
        </button>
        <div className="p-2">
          <div className="font-light text-[0.8rem]">
            {props.item.type === 'tv'
              ? `Watching S${props.item.season} Episode-${props.item.episode}`
              : ''}
          </div>
          <p className="font-medium text-[0.9rem]">
            {props.item.type === 'movie' ? props.item.item.title : props.item.item.name}
          </p>
        </div>
        <div className="widecard-play flex items-center absolute bottom-5 right-[10px]">
          <i className="fa-solid fa-play fa-xl text-white" alt="Play Icon" />
        </div>
      </div>
    </Link>
  );
}
