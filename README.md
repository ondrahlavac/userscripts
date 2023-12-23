# Userscripts

Collection of my personal userscripts, which I find somewhat useful and
keep tinkering with.


# Installation guide

If you are using GreaseMonkey, all you have to do is choose a userscript you
like, view it in RAW and you will be prompted to install it. It does not get
easier than that.



# List of my user scripts

## Wedos - payment page favourites

### Objective

When a user comes to the payment page, select his favourite payment method and hide all other methods to hide the clutter.

### How to do it
- On page load, find all the rows with payment methods.
- For each of the rows, determine the name of the method.
  - If the name of the method is the same as the favourite one of the user, select the input radio in it.
  - Otherwise hide the row.

### Future enhancements
- add a button to show all hidden methods
- add a star emoji button next to name of the method, to let the user set it as his favourite
- save the key of the payment method in the keyvalue store of your monkey flavour extension

## Movie details on hover

### Objective

When user hovers over a text, that resembles a movie name, e.g. a torrent file name, we want to fetch and show details
about the movie, including the poster and description.

### How to do it

- Store personal TMDB API key in userscript keyval store
- For predetermined page elements, find movie (or tv show) name in its HTML.
- Cleanup the string and get all the helpful data from it - name, year, media type (i.e. movie or tv)
- Search for the movie on TMDB API
- Display found movie details in floating card on page
- Show nothing if movie could not be found
- Cache retrieved data to prevent needless calls to the API

### Future enhancements

- store TMDB lookup cache in UserScript keyval store
- ask for TMDB api key if none stored in UserScript keyval store
- show rating of the movie/tv series
- optimize search using the year of the release
- cleanup - make sure functions do just one thing
- cleanup - templating
- cleanup - correct use of async functions and event driven display of search results
- get API configuration as the first call to the API (baseUrl et al)
