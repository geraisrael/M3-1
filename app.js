const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let movies = [];
let directors = [];
let actors = [];
let movieActors = [];

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

directors.push({
  id: "dir_mx_001",
  name: "Alfonso Cuarón",
  nationality: "Mexicano",
  birthYear: 1961,
  birthPlace: "Ciudad de México",
  notableAwards: ["2 Óscares", "3 Premios BAFTA", "Globo de Oro"]
});

actors.push(
  {
    id: "act_mx_001",
    name: "Gael García Bernal",
    nationality: "Mexicano",
    birthYear: 1978,
    birthPlace: "Guadalajara, Jalisco",
    notableAwards: ["Premio del Festival de Cannes", "2 Premios BAFTA"]
  },
  {
    id: "act_mx_002",
    name: "Diego Luna",
    nationality: "Mexicano",
    birthYear: 1979,
    birthPlace: "Toluca, Estado de México",
    notableAwards: ["Premio Marcello Mastroianni", "Diosa de Plata"]
  }
);

movies.push({
  id: "mx_001",
  title: "Y tu mamá también",
  releaseYear: 2001,
  genre: ["Drama", "Road Movie", "Coming of Age"],
  duration: 105,
  directorId: "dir_mx_001",
  rating: 7.7,
  language: "Español",
  country: "México"
});

movieActors.push(
  { movieId: "mx_001", actorId: "act_mx_001", characterName: "Julio Zapata" },
  { movieId: "mx_001", actorId: "act_mx_002", characterName: "Tenoch Iturbide" }
);


app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a CineBase API',
    endpoints: {
      movies: '/api/movies',
      directors: '/api/directors',
      actors: '/api/actors'
    }
  });
});



// GET /api/movies 
app.get('/api/movies', (req, res) => {
  let result = [...movies];
  
  const { genre, minRating, minYear, maxYear } = req.query;
  
  
  if (genre) {
    result = result.filter(movie => 
      movie.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }
  
  
  if (minRating) {
    const rating = parseFloat(minRating);
    result = result.filter(movie => movie.rating >= rating);
  }
  
  
  if (minYear) {
    const year = parseInt(minYear);
    result = result.filter(movie => movie.releaseYear >= year);
  }
  
  
  if (maxYear) {
    const year = parseInt(maxYear);
    result = result.filter(movie => movie.releaseYear <= year);
  }
  
  res.json({
    count: result.length,
    movies: result
  });
});

// GET /api/movies/:id 
app.get('/api/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === req.params.id);
  
  if (!movie) {
    return res.status(404).json({ 
      error: 'Película no encontrada',
      id: req.params.id
    });
  }
  
  
  const director = directors.find(d => d.id === movie.directorId);
  
  
  const movieActorsList = movieActors
    .filter(ma => ma.movieId === movie.id)
    .map(ma => {
      const actor = actors.find(a => a.id === ma.actorId);
      return {
        ...actor,
        characterName: ma.characterName
      };
    });
  
  res.json({
    ...movie,
    director,
    actors: movieActorsList
  });
});

// POST /api/movies
app.post('/api/movies', (req, res) => {
  const { title, releaseYear, genre, duration, directorId, rating, language, country } = req.body;
  

  if (!title || !releaseYear || !genre || !duration || !directorId) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      required: ['title', 'releaseYear', 'genre', 'duration', 'directorId']
    });
  }
  
  const directorExists = directors.find(d => d.id === directorId);
  if (!directorExists) {
    return res.status(422).json({ 
      error: 'El director especificado no existe',
      directorId
    });
  }
  
  const movieExists = movies.find(m => 
    m.title.toLowerCase() === title.toLowerCase() && m.releaseYear === releaseYear
  );
  if (movieExists) {
    return res.status(409).json({ 
      error: 'Ya existe una película con ese título y año',
      existingMovie: movieExists
    });
  }
  
  const newMovie = {
    id: generateId('movie'),
    title,
    releaseYear,
    genre: Array.isArray(genre) ? genre : [genre],
    duration,
    directorId,
    rating: rating || 0,
    language: language || 'Español',
    country: country || 'México'
  };
  
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// PUT /api/movies/:id 
app.put('/api/movies/:id', (req, res) => {
  const movieIndex = movies.findIndex(m => m.id === req.params.id);
  
  if (movieIndex === -1) {
    return res.status(404).json({ 
      error: 'Película no encontrada',
      id: req.params.id
    });
  }
  
  const { directorId } = req.body;
  

  if (directorId && directorId !== movies[movieIndex].directorId) {
    const directorExists = directors.find(d => d.id === directorId);
    if (!directorExists) {
      return res.status(422).json({ 
        error: 'El director especificado no existe',
        directorId
      });
    }
  }
  

  movies[movieIndex] = {
    ...movies[movieIndex],
    ...req.body,
    id: req.params.id 
  };
  
  res.json(movies[movieIndex]);
});

// DELETE /api/movies/:id 
app.delete('/api/movies/:id', (req, res) => {
  const movieIndex = movies.findIndex(m => m.id === req.params.id);
  
  if (movieIndex === -1) {
    return res.status(404).json({ 
      error: 'Película no encontrada',
      id: req.params.id
    });
  }
  
  const deletedMovie = movies[movieIndex];
  
  
  movieActors = movieActors.filter(ma => ma.movieId !== req.params.id);
  
  movies.splice(movieIndex, 1);
  
  res.json({ 
    message: 'Película eliminada exitosamente',
    deletedMovie
  });
});



// GET /api/directors 
app.get('/api/directors', (req, res) => {
  let result = [...directors];
  
  const { nationality, minBirthYear } = req.query;
  
  
  if (nationality) {
    result = result.filter(director => 
      director.nationality.toLowerCase().includes(nationality.toLowerCase())
    );
  }
  
  
  if (minBirthYear) {
    const year = parseInt(minBirthYear);
    result = result.filter(director => director.birthYear >= year);
  }
  
  res.json({
    count: result.length,
    directors: result
  });
});

// GET /api/directors/:id/movies 
app.get('/api/directors/:id/movies', (req, res) => {
  const director = directors.find(d => d.id === req.params.id);
  
  if (!director) {
    return res.status(404).json({ 
      error: 'Director no encontrado',
      id: req.params.id
    });
  }
  
  const directorMovies = movies.filter(m => m.directorId === req.params.id);
  
  res.json({
    director,
    moviesCount: directorMovies.length,
    movies: directorMovies
  });
});

// POST /api/directors 
app.post('/api/directors', (req, res) => {
  const { name, nationality, birthYear, birthPlace, notableAwards } = req.body;
  

  if (!name || !nationality || !birthYear) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      required: ['name', 'nationality', 'birthYear']
    });
  }
  
  const directorExists = directors.find(d => 
    d.name.toLowerCase() === name.toLowerCase()
  );
  if (directorExists) {
    return res.status(409).json({ 
      error: 'Ya existe un director con ese nombre',
      existingDirector: directorExists
    });
  }
  
  const newDirector = {
    id: generateId('dir'),
    name,
    nationality,
    birthYear,
    birthPlace: birthPlace || '',
    notableAwards: notableAwards || []
  };
  
  directors.push(newDirector);
  res.status(201).json(newDirector);
});


// GET /api/actors 
app.get('/api/actors', (req, res) => {
  let result = [...actors];
  
  const { nationality, minBirthYear } = req.query;
  

  if (nationality) {
    result = result.filter(actor => 
      actor.nationality.toLowerCase().includes(nationality.toLowerCase())
    );
  }
  
 
  if (minBirthYear) {
    const year = parseInt(minBirthYear);
    result = result.filter(actor => actor.birthYear >= year);
  }
  
  res.json({
    count: result.length,
    actors: result
  });
});

// GET /api/actors/:id/movies 
app.get('/api/actors/:id/movies', (req, res) => {
  const actor = actors.find(a => a.id === req.params.id);
  
  if (!actor) {
    return res.status(404).json({ 
      error: 'Actor no encontrado',
      id: req.params.id
    });
  }
  
  const actorMovieIds = movieActors
    .filter(ma => ma.actorId === req.params.id)
    .map(ma => ma.movieId);
  
  const actorMovies = movies.filter(m => actorMovieIds.includes(m.id))
    .map(movie => {
      const ma = movieActors.find(ma => ma.movieId === movie.id && ma.actorId === req.params.id);
      return {
        ...movie,
        characterName: ma.characterName
      };
    });
  
  res.json({
    actor,
    moviesCount: actorMovies.length,
    movies: actorMovies
  });
});

// POST /api/actors 
app.post('/api/actors', (req, res) => {
  const { name, nationality, birthYear, birthPlace, notableAwards } = req.body;
  
  
  if (!name || !nationality || !birthYear) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      required: ['name', 'nationality', 'birthYear']
    });
  }
  
  const actorExists = actors.find(a => 
    a.name.toLowerCase() === name.toLowerCase()
  );
  if (actorExists) {
    return res.status(409).json({ 
      error: 'Ya existe un actor con ese nombre',
      existingActor: actorExists
    });
  }
  
  const newActor = {
    id: generateId('act'),
    name,
    nationality,
    birthYear,
    birthPlace: birthPlace || '',
    notableAwards: notableAwards || []
  };
  
  actors.push(newActor);
  res.status(201).json(newActor);
});


// POST /api/movies/:movieId/actors 
app.post('/api/movies/:movieId/actors', (req, res) => {
  const { actorId, characterName } = req.body;
  const { movieId } = req.params;
  
  
  if (!actorId || !characterName) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      required: ['actorId', 'characterName']
    });
  }
  
  
  const movie = movies.find(m => m.id === movieId);
  if (!movie) {
    return res.status(404).json({ 
      error: 'Película no encontrada',
      movieId
    });
  }
  
  
  const actor = actors.find(a => a.id === actorId);
  if (!actor) {
    return res.status(422).json({ 
      error: 'El actor especificado no existe',
      actorId
    });
  }
  
  const relationExists = movieActors.find(ma => 
    ma.movieId === movieId && ma.actorId === actorId
  );
  if (relationExists) {
    return res.status(409).json({ 
      error: 'Este actor ya está asignado a esta película',
      existingRelation: relationExists
    });
  }
  
  const newRelation = {
    movieId,
    actorId,
    characterName
  };
  
  movieActors.push(newRelation);
  
  res.status(201).json({
    message: 'Actor agregado a la película exitosamente',
    movie: movie.title,
    actor: actor.name,
    characterName
  });
});

// GET /api/movies/:movieId/actors 
app.get('/api/movies/:movieId/actors', (req, res) => {
  const { movieId } = req.params;
  
  
  const movie = movies.find(m => m.id === movieId);
  if (!movie) {
    return res.status(404).json({ 
      error: 'Película no encontrada',
      movieId
    });
  }
  
  const movieActorsList = movieActors
    .filter(ma => ma.movieId === movieId)
    .map(ma => {
      const actor = actors.find(a => a.id === ma.actorId);
      return {
        ...actor,
        characterName: ma.characterName
      };
    });
  
  res.json({
    movie: movie.title,
    actorsCount: movieActorsList.length,
    actors: movieActorsList
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`Servidor CineBase ejecutándose en http://localhost:${PORT}`);
  console.log(`Películas iniciales: ${movies.length}`);
  console.log(`Directores iniciales: ${directors.length}`);
  console.log(`Actores iniciales: ${actors.length}`);
});