// Importeer het npm package Express (uit de door npm aangemaakte node_modules map)
// Deze package is geïnstalleerd via `npm install`, en staat als 'dependency' in package.json
import express from 'express'

// Importeer de Liquid package (ook als dependency via npm geïnstalleerd)
import { Liquid } from 'liquidjs';


console.log('Hieronder moet je waarschijnlijk nog wat veranderen')
// Doe een fetch naar de data die je nodig hebt
// const apiResponse = await fetch('...')

// Lees van de response van die fetch het JSON object in, waar we iets mee kunnen doen
// const apiResponseJSON = await apiResponse.json()

// Controleer eventueel de data in je console
// (Let op: dit is _niet_ de console van je browser, maar van NodeJS, in je terminal)
// console.log(apiResponseJSON)

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express()); 

app.set('views', './views')

async function reqDATA(endpoint, params = {}) {
  const url = 'https://fdnd-agency.directus.app/items/' + endpoint + '?' + new URLSearchParams(params);
  const response = await fetch(url);
  const json = await response.json();
  return json.data;
}
// data ophalen uit directus en omzetten naar json 

// endpoint                -> de collectie in directus ophalen
// params                  -> eventuele filters sortering
// fetch(url)              -> vraagt de data op bij directus via http
// await response.json()   -> zet om naar json
// return json.data        -> je krijgt een array van items die in routes gebruikt kunnen worden en naar liquid kan sturen


// Routes
app.get('/', async function (request, response) {
   // Render index.liquid uit de Views map
   // Geef hier eventueel data aan mee
  response.render('index.liquid', { title: 'Home', menuClass: 'home' });
});

app.get('/instruments', async function (request, response) {
  const currentInstrument = request.query.instrument || '';
  const currentStatus = request.query.status || '';
  const limitParam = request.query.limit;
  const showAll = limitParam === 'all';
  const parsedLimit = parseInt(limitParam, 10);
  const limit = showAll ? Number.POSITIVE_INFINITY : (Number.isNaN(parsedLimit) ? 10 : parsedLimit);

  const allInstruments = await reqDATA('preludefonds_instruments');
  const instrumentOptions = [...new Set(allInstruments.map((item) => item.instrument).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'nl'));

  const statusOptions = ['Beschikbaar', 'Uitgeleend', 'Beschadigd', 'Onder onderhoud'];

  const filteredInstruments = allInstruments.filter((item) => {
    const instrumentMatch = currentInstrument ? item.instrument === currentInstrument : true;
    const statusMatch = currentStatus ? item.status === currentStatus : true;
    return instrumentMatch && statusMatch;
  });

  const visibleInstruments = [...filteredInstruments].sort((left, right) =>
    (left.name || '').localeCompare(right.name || '', 'nl')
  );

  const instruments = visibleInstruments.slice(0, limit);
  const hasMore = visibleInstruments.length > limit;
  const totalCount = visibleInstruments.length;

  response.render('overzicht.liquid', {
    instruments,
    menuClass: 'overzicht',
    hasMore,
    totalCount,
    instrumentOptions,
    statusOptions,
    currentInstrument,
    currentStatus,
    currentLimit: showAll ? 'all' : String(limit)
  });
});

app.get('/instruments/new', async function (request, response) {
  response.render('toevoegen.liquid', { menuClass: 'add', title: 'Instrument toevoegen' });
});

app.get('/instruments/:key', async function (request, response) {
  const instruments = await reqDATA('preludefonds_instruments', { 'filter[key][_eq]': request.params.key });
  const instrument = instruments[0];
  response.render('informatie.liquid',  { instrument, menuClass: 'overzicht' });
});

app.post('/', async function (request, response) {
  // Je zou hier data kunnen opslaan, of veranderen, of wat je maar wilt
  // Er is nog geen afhandeling van een POST, dus stuur de bezoeker terug naar /
  response.redirect(303, '/')
})

app.use(function (request, response) {
  response.status(404).render('404.liquid')
})

// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})

// [_icontains]
// fields= name, Date