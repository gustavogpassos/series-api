const express = require('express');
const {v4: uuidv4} = require('uuid');


const app = express();

app.use(express.json());


const users = [];

/**
 * função que verifica se o usuário existe
 * usada como middleware nas demais funções 
 */
function checkUserExists(req,res,next){
  const {username} = req.headers;

  const user = users.find((user)=>user.username===username);

  if(!user){
    return res.status(404).json({message:"User not found."});
  }

  req.user = user;

  next();
}

/**
 * rota para criação de um novo usuario
 * cada usuario tem:
 *  id
 *  nome
 *  username
 */
app.post('/users', (req,res)=>{
  const {name, username} = req.body;

  const userAlreadyExists = users.find((user)=>user.username===username);

  if(userAlreadyExists){
    return res.status(400).json({message:"User already exists"});
  }

  const user = {
    id:uuidv4(),
    name,
    username,
    series: []
  }

  users.push(user)

  return res.status(201).send(user);
});

/**
 * rota para update do nome do usuário
 * essa rota recebe:
 *  username > header
 *  name > body
 */
app.put('/users', checkUserExists, (req,res)=>{
  const {user} = req;
  const {name} = req.body;

  user.name = name;

  return res.status(201).send(user);
});

/**
 * rota para criação de uma série
 * cada série tem:
 *  id
 *  nome
 *  quantidade de capítulos
 *  lista de capítulos
 */
app.post('/series', checkUserExists,(req,res)=>{
  const {series} = req.user;
  const {name, qt_chapters} = req.body;

  const chapters = [];

  for(let i=1;i<=qt_chapters;i++){
    const chap = {
      chapter:i,
      watched:false
    }
    chapters.push(chap);
  }

  const serie = {
    id:uuidv4(),
    name,
    qt_chapters,
    chapters,
  }

  series.push(serie);

  return res.status(201).send(serie);
  
});

/**
 * rota para obter a lista de séries do usuário
 * essa rota recebe:
 *  username > header;
 */
app.get('/series', checkUserExists, (req,res)=>{
  const {series} = req.user;
  return res.status(200).send(series);
})

/**
 * rota para marcar um capítulo como assistido
 * esta rota recebe:
 *  id da serie > route param;
 *  username > header;
 *  número do capítulo > body;
 */
app.patch('/series/:id/watched', checkUserExists, (req,res)=>{
  const {series} = req.user;
  const {id_chapter} = req.body;
  const {id} = req.params;

  const serie = series.find((serie)=>serie.id===id);

  if(!serie){
    return res.status(404).json({message:"Serie not found"});
  }

  const {chapters} = serie;

  const chapter = chapters.find((part)=>part.chapter===id_chapter);

  if(!chapter){
    return res.status(404).json({message:"Invalid chapter"});
  }

  chapter.watched = true;

  return res.status(201).json(serie);
});




module.exports = app;