// ==UserScript==
// @name        Fetch movie details from TMBD by name
// @version     0.5.2
// @author      Ondra Hlaváč <ondra@hlavac.cz>
// @description Displays a card with movie info, when hovering over movie name.
// @namespace   https://ondra.hlavac.cz/
// @match       https://*.info/browse.php
// @grant       GM.getValue
// @license     MIT
// @run-at      document-end
// @homepageURL https://github.com/ondrahlavac/userscripts
// @updateURL   https://github.com/ondrahlavac/userscripts/raw/master/movie-details-on-hover.user.js
// @downloadURL https://github.com/ondrahlavac/userscripts/raw/master/movie-details-on-hover.user.js
// @supportURL  https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

const trackerCategoryToMediaType = {
  7: 'tv',
  19: 'movie',
  51: 'movie'
}
const tmdbBaseUrl ='https://image.tmdb.org/t/p/' // TODO: get it from API config
const tmdbLookupCache = {} // save to keyvalue store and introduce cache expiration

let activeRow = null

const previewElement = document.createElement('div')
previewElement.style.position = 'absolute'
previewElement.style.padding = '15px'
previewElement.style.border = '1px solid #aaa'
previewElement.style.borderRadius = '15px'
previewElement.style.width = '450px'
previewElement.style.backgroundColor = '#000000'
previewElement.style.opacity = '0.86'
previewElement.style.display = 'none'
document.body.appendChild(previewElement)


const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: ''
  },
  referrer: '',
}

GM.getValue('tmdbApiKey', 'CAUTION_-_NO_API_KEY_PROVIDED')
  .then(tmdbApiKey => options.headers.Authorization = `Bearer ${tmdbApiKey}`)

const searchTMDB = (queryString) => {
  let encodedQueryString = encodeURI(queryString)
  fetch(`https://api.themoviedb.org/3/search/multi?query=${encodedQueryString}&include_adult=true&language=en-US&page=1`, options)
    .then(response => response.json())
    .then(response => saveTMDBData(queryString, response.results))
    .catch(err => console.error(err));
}

const saveTMDBData = (queryString, results) => {
  // TODO: clean up this function - it should only save - display should be elsewhere
  if (results.length > 0) {
    tmdbLookupCache[queryString] = results[0]
    fillTemplate(results[0])
  } else {
    previewElement.innerHTML = ''
    previewElement.style.display = 'none'
  }
}


// --- helper functions
const matchCategoryFromTypeLink = (link) => {
  const regex = /[?&]cat\[]=(7|19|51)(?:&|$)/
  const match = link.match(regex)
  if (match) {
    return match[1]
  } else {
    return false
  }
}

const cleanupTvName = (rawName) => {
  const tvRegEx = /^.*?(?=\.S\d{2})/ig
  const match = rawName.match(tvRegEx)
  return match ? match[0].replaceAll('.', ' ') : null
}

const cleanupMovieName = (rawName) => {
  const movieRegEx = /^.*(?=\.[1|2]\d{3}\.)/ig
  const match = rawName.match(movieRegEx)
  return match ? match[0].replaceAll('.', ' ') : null
}


const onMouseOver = (event) => {
  if (!activeRow || activeRow != event.currentTarget) {
    activeRow = event.currentTarget
    const rawTorrentName = activeRow.querySelector('tr.browse span > a').title
    const category = matchCategoryFromTypeLink(activeRow.querySelector('tr.browse td > a > img').parentElement.href)

    switch (trackerCategoryToMediaType[category]) {
      case 'tv':
        // try to get just the first part of the name, before SXX
        const tvName = cleanupTvName(rawTorrentName)
        if (tmdbLookupCache[tvName]) {
          fillTemplate(tmdbLookupCache[tvName])
        } else {
          searchTMDB(tvName)
        }
        break
      case 'movie':
        // try to get just the movie name before .YYYY.
        const movieName = cleanupMovieName(rawTorrentName)
        if (tmdbLookupCache[movieName]) {
          fillTemplate(tmdbLookupCache[movieName])
        } else {
          searchTMDB(movieName)
        }
        break
      default:
        // not a supported category
        previewElement.innerHTML = ''
        previewElement.style.display = 'none'
        return
    }


    previewElement.style.display = 'block'
  }
}  
const onMouseLeave = (event) => {
  previewElement.style.display = 'none'
  activeRow = null
}


// initialize everything
window.addEventListener('load', function () {
  // try to find triggers a bind them to mouse events
  var tableRows = document.querySelectorAll('#torrent_browse tr.browse')
  for( var i=0; i<tableRows.length; i++) {
    tableRows[i].addEventListener('mouseover', onMouseOver)
    tableRows[i].addEventListener('mouseleave', onMouseLeave)
  }
}, false)


// Listen for mousemove event to move the display window
document.addEventListener('mousemove', (event) => {
  const mouseX = event.clientX + window.scrollX + 25
  const mouseY = event.clientY + window.scrollY - 200

  // Update the position of the mouseDiv
  previewElement.style.left = mouseX + 'px';
  previewElement.style.top = mouseY + 'px';
})


const fillTemplate = (source) => {

  let dataToFill = {
    name: source.media_type === 'tv' ? source.name : source.title,
    year: source.media_type === 'tv' ? new Date(source.first_air_date) : new Date(source.release_date),
    overview: source.overview,
    poster_path: source.poster_path,
  }

  const posterHTML = dataToFill.poster_path ? `
<img id="tmdb-image"
     src="${tmdbBaseUrl}w185/${dataToFill.poster_path}"
     alt="Poster for ${dataToFill.name}"
     referrerpolicy="no-referrer"
/>` : ``

  previewElement.innerHTML = `
    <div style="display:flex;flex-spacing:justify">
      <div style="flex: 1">
        ${posterHTML}
      </div>
      <div style="flex: 1">
        <h2>
          <span id="tmdb-name">${dataToFill.name}</span> - <span id="tmdb-year">${dataToFill.year.getFullYear()}</span>
        </h2>
        <p>${dataToFill.overview}</p>
      </div>
    </div>
    <p style="font-size:0.5rem">All data provided by <a href="//nullreferer.com/?https://www.themoviedb.org/" >The Movie DB</a></p>`
}