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

# Work in progress

This project is work in progress and not all boostrap sass usage supported (@extend, if, twbs-font-path)

For example, you should remove the @at-root and @font-face directives of glyphicons.css to don't have error. Of cours Glyphicons don't works.

```css
@at-root {

  @font-face {
    font-family: 'Glyphicons Halflings';
    src: url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.eot'), '#{$icon-font-path}#{$icon-font-name}.eot'));
    src: url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.eot?#iefix'), '#{$icon-font-path}#{$icon-font-name}.eot?#iefix')) format('embedded-opentype'),
         url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.woff2'), '#{$icon-font-path}#{$icon-font-name}.woff2')) format('woff2'),
         url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.woff'), '#{$icon-font-path}#{$icon-font-name}.woff')) format('woff'),
         url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.ttf'), '#{$icon-font-path}#{$icon-font-name}.ttf')) format('truetype'),
         url(if($bootstrap-sass-asset-helper, twbs-font-path('#{$icon-font-path}#{$icon-font-name}.svg##{$icon-font-svg-id}'), '#{$icon-font-path}#{$icon-font-name}.svg##{$icon-font-svg-id}')) format('svg');
  }
}
```
