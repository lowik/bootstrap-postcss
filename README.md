# Bootstap PostCSS

The boostrap PostCSS version

# Why

* Hangs issue with webpack and sass
https://github.com/webpack/webpack-dev-server/issues/128

* "Bootstrap 5 will likely be in PostCSS", but when?
http://www.reddit.com/r/webdev/comments/33pnod/oh_btwbootstrap_4_will_be_in_scss_and_if_you_care/

* PostCSS sounds cool

# Usage

Current bootstrap SASS version converted to PostCSS is a vailable in /assets
To convert a new version, update the bootstrap-sass version and run npm start

# PostCSS required plugins

Some plugins will be required to use boostrap-postcss:
* postcss-import
* postcss-mixins
* postcss-nested
* postcss-simple-vars
* postcss-color-function

Don't forget adding them