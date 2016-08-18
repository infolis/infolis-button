// ==UserScript==
// @name         Infolis Button
// @namespace    kba
// @version      {{ VERSION }}
// @description  try to take over the world!
// @author       You
// @match        */*
// @downloadURL  {{ ASSET_SERVER }}/infolis-button.user.js

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_log
// @grant        GM_getResourceText
// @grant        GM_getResourceURL

// require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @require      https://code.jquery.com/jquery-2.2.0.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/async/1.5.2/async.js
// @require      https://raw.githubusercontent.com/olado/doT/master/doT.js
// @require      https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js
// @require      {{ ASSET_SERVER }}/scoped.js

// @resource     infolis_logo.png https://raw.githubusercontent.com/infolis/infolis.github.io/master/img/logo-circle.png

// @resource     marx.css https://cdn.rawgit.com/mblode/marx/master/css/marx.min.css
// @resource     font-awesome.css https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css
// @resource     bootstrap.css https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css
// @resource     animate.css https://raw.githubusercontent.com/daneden/animate.css/master/animate.css
// @resource     infolis.css {{ ASSET_SERVER }}/infolis.css

// @resource     site_button.html {{ ASSET_SERVER }}/tpl/site_button.html

// ==/UserScript==
/* jshint esversion: 6, white: true, -W097, forin: true */
/* globals window */
/* globals doT */
/* globals $ */
/* globals jQuery */
/* globals console */
/* globals scopedPolyFill */
/* globals GM_config */
/* globals GM_xmlhttpRequest */
/* globals GM_registerMenuCommand */
/* globals document */
/* globals GM_getResourceText */
/* globals setTimeout */
/* globals async */
