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