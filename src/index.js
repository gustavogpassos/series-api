const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

const mongoose = require("./utils/database")(app);
const User = require("./models/User");

app.use(express.json());

const users = [];

/**
 * função que verifica se o usuário existe
 * usada como middleware nas demais funções 
 */
async function checkUserExists(req, res, next) {
  const { username } = req.headers;

  const user = await User.findOne({ username: username });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  req.user = user;
  next();
}

/**
 * rota para criação de um novo usuario
 * essa rota recebe:
 *  nome > body;
 *  username > body;
 * 
 * essa rota retorna:
 *  o usuário que foi criado
 */
app.post('/users', async (req, res) => {
  const { name, username } = req.body;
  const userAlreadyExists = await User.findOne({ username: username });

  if (userAlreadyExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  const newUser = {
    id: uuidv4(),
    name,
    username,
    series: []
  }
  users.push(newUser);

  try {
    await User.create(newUser);
    return res.status(200).json({ mesage: "Resource created", newUser })
  } catch (err) {
    return res.status(500).json({ message: err });
  }
});

/**
 * rota para update do nome do usuário
 * essa rota recebe:
 *  username > header
 *  name > body
 */
app.put('/users', checkUserExists, async (req, res) => {
  const { _id } = req.user;
  const { name } = req.body;

  try {
    await User.updateOne({ _id: _id }, { name: name })
    return res.status(201).send(req.user);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
});

/**
 * rota para criação de uma série
 * cada série tem:
 *  id
 *  nome
 *  quantidade de episódios
 *  lista de episódios
 */
app.post('/series', checkUserExists, async (req, res) => {
  const { _id, series } = req.user;
  const { name, qt_episodes } = req.body;
  const episodes = [];
  for (let i = 1; i <= qt_episodes; i++) {
    const chap = {
      number: i,
      watched: false
    }
    episodes.push(chap);
  }
  const serie = {
    id: uuidv4(),
    name,
    qt_episodes,
    episodes,
  }

  series.push(serie);

  try {
    await User.updateOne({ _id: _id }, { series: series });
    return res.status(201).send(serie);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
});

/**
 * rota para obter a lista de séries do usuário
 * essa rota recebe:
 *  username > header;
 * 
 * essa rota retorna:
 *  a lista de series do usuário
 */
app.get('/series', checkUserExists, (req, res) => {
  const { series } = req.user;
  return res.status(200).send(series);
})

/**
 * rota para marcar um capítulo como assistido
 * esta rota recebe:
 *  id da serie > route param;
 *  username > header;
 *  número do capítulo > body;
 * 
 * essa rota retorna:
 *  os dados da série que foi modificada;
 */
app.patch('/series/:id/watched', checkUserExists, async (req, res) => {
  const { _id, series } = req.user;
  const { ep_number } = req.body;
  const { id } = req.params;
  const serie = series.find((serie) => serie.id === id);
  if (!serie) {
    return res.status(404).json({ message: "Serie not found" });
  }

  const { episodes } = serie;
  const episode = episodes.find((episode) => episode.number === ep_number);
  if (!episode) {
    return res.status(404).json({ message: "Invalid episode" });
  }

  episode.watched = true;

  try {
    await User.updateOne({ _id: _id }, { series: series });
    return res.status(201).json(serie);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
});

/**
 * rota para obter o progresso de episódios assistidos
 * essa rota recebe:
 *  id da serie > route param;
 *  username > header;
 * 
 * essa rota retorna:
 *  o valor calculado do percentual de progresso sem decimais;
 */
app.get('/series/:id/progress', checkUserExists, (req, res) => {
  const { series } = req.user;
  const { id } = req.params;
  const serie = series.find((serie) => serie.id === id);
  if (!serie) {
    return res.status(404).json({ message: "Serie not found" });
  }
  const { episodes } = serie;
  const watched = episodes.filter((episode) => episode.watched === true);
  const progress = ((watched.length * 100) / serie.qt_episodes).toFixed(0);
  return res.status(200).send(progress);
});


module.exports = app;