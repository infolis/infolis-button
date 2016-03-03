// ==UserScript==
// @name         Infolis Button
// @namespace    kba
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        */*
// @downloadURL  https://www-test.bib.uni-mannheim.de/infolis/infolis-button/infolis-button.user.js

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
// @require      https://www-test.bib.uni-mannheim.de/infolis/infolis-button/scoped.js

// @resource     infolis_logo.png https://raw.githubusercontent.com/infolis/infolis.github.io/master/img/logo-circle.png

// @resource     marx.css https://cdn.rawgit.com/mblode/marx/master/css/marx.min.css
// @resource     font-awesome.css https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css
// @resource     bootstrap.css https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css
// @resource     animate.css https://raw.githubusercontent.com/daneden/animate.css/master/animate.css
// @resource     infolis.css https://www-test.bib.uni-mannheim.de/infolis/infolis-button/infolis.css
// @resource     site.css https://www-test.bib.uni-mannheim.de/infolis/infolis-button/site.css

// @resource     site_button.html https://www-test.bib.uni-mannheim.de/infolis/infolis-button/tpl/site_button.html

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

"use strict";
this.$ = this.jQuery = jQuery.noConflict(true);

/*
 *
 * http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0117619
 *
 */
console.log('start infolis user.js');
var SCRIPT_ID = 'InfolisButtonConfig';
var ZOTERO_API = 'https://www-test.bib.uni-mannheim.de/infolis/zotero/' ;
var BUTTON_DATA_API = 'https://www-test.bib.uni-mannheim.de/infolis/infolis-button-db' ;
var SITE_BUTTON;
var STATUSES = [
	'inactive',
	'ready',
	'working',
	'ok',
	'fail'
];
var SCOPED_CSS = [
	'<style scoped>',
	` * {
		margin: 0;
		padding: 0;
		border: 0;
		/*background: initial;*/
		/*color: initial;*/
	} `,
	GM_getResourceText('animate.css'),
	GM_getResourceText('marx.css'),
	GM_getResourceText('bootstrap.css'),
	GM_getResourceText('infolis.css'),
	'</style>'
].join("\n\n");
var SITE_CSS = $('head').append(`<style>` + GM_getResourceText('site.css') + '</style>');
var FILTER = {
	enabled: false,
	text: ''
};

function LOG() {
	if (arguments[0]) {
		console.error(arguments[0]);
	} else if (arguments[1]) {
		console.info(arguments[1]);
	}
}

// function zoteroScrape(

/*
 * Simple Database
 */
var JsonApi = function() {
};
JsonApi.prototype.list = function(coll) {
	return Object.keys(this.json[coll] || []);
};
JsonApi.prototype.get = function getByCollectionAndId(coll, id, cb) {
	GM_xmlhttpRequest({
		method: "GET",
		url: BUTTON_DATA_API + '/' + coll + '?identifier=' + id,
		onload: function(response) {
			// console.log("Retrieve from backend: ", coll, id, response.responseText);
			if (response.status !== 200) {
				// return cb(null, {'identifier': id});
				return cb(response.status);
			}
			var pub = JSON.parse(response.responseText);
			async.each(['datasets', 'databases'], function(coll, doneColl) {
				async.map(pub[coll] || [], function(id, doneId) {
					return DB.get(coll, id, doneId);
				}, function(err, instantiated) {
					if (!err && instantiated.length) 
						pub[coll] = instantiated;
					return doneColl(err);
				});
			}, function(err) {
				return cb(null, pub);
			});
		}
	});
};
var DB = new JsonApi(JSON.parse(GM_getResourceText('data.json')));


/*
 * CSS for config dialog
 */
var CONFIG_CSS = `
	SCRIPT_ID {
		color: white;
		background:
			linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ),
			url(https://raw.githubusercontent.com/infolis/infolis.github.io/master/img/visualize-links_01.png) ;
	}
	SCRIPT_ID textarea { font-family: monospace; }
	SCRIPT_ID h2,h3 { text-align: center; }
	SCRIPT_ID input[type='text'] { font-family: monospace; }
`.replace(/SCRIPT_ID/gm, '#' + SCRIPT_ID);

var CONFIG_FRAME_STYLE = `
	bottom: auto
	border: 1px solid #000
	display: none
	height: 75%
	top: 50px
	left: 20px;
	bottom: 50px
	margin: 0
	max-height: 95%
	width: 90%
	overflow: auto
	padding: 0
	position: fixed
	right: auto
	z-index: 9999
	opacity: 1
`.replace(/\n\s*/g, ';');

/*
 * Config values
 */

GM_config.init({
	'id': SCRIPT_ID,
	'title': 'Configure InfolisButton',
	'fields': {

		'auto_activate': {
			'label': 'Activate on page load?',
			'type': 'checkbox',
			'default': false,
		},

		'auto_fetch': {
			'label': 'Automatically fetch after activating?',
			'type': 'checkbox',
			'default': false,
		},

		"bad_databases": {
			'label': 'Low Priority databases',
			'type': 'textarea',
			'rows': 4,
			'default': [
				'yahoo',
			].join("\n"),
		},

		"good_databases": {
			'label': 'High Priority databases',
			'type': 'textarea',
			'rows': 4,
			'default': [
				'bloomberg',
				'gfd'
			].join("\n"),
		},

		'regex_doi': {
			'label': 'DOI Regex',
			'type': 'text',
			'default': '\\b(10\\.[0-9]{4,}/[^\\s&"\']*[^\\s&"\'.,])\\b',
		},

	},

	"events": {
		'open': function(configDocument, configWindow) {

			// console.debug(CONFIG_FRAME_STYLE);
			this.frame.setAttribute('style', CONFIG_FRAME_STYLE);

			configDocument.addEventListener('keydown',  function keyHandler(e) {
				if (e.which === 27) {
					// GM_config.save();
					GM_config.close();
				}
			});

			var DOLLAR = function(arg) {
				return $(arg, configDocument);
			};

			DOLLAR("style").html(CONFIG_CSS);
			DOLLAR("head")
				.append($("<link rel='stylesheet'>").attr('href', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css'))
				.append($('<script>').attr('src','http://code.jquery.com/jquery-latest.js'))
				.append($('<script>').attr('src','https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js'));

			DOLLAR("body > div > div:last-child").attr('style', 'position:fixed; right:0; top: 0;');
			DOLLAR("div.config_header").html($("<div class='col-sm-12'>").append($("<h2>").html(DOLLAR("div.config_header").html())));
			DOLLAR("div.section_header").hide();
			DOLLAR(".config_var").each(function() {
				DOLLAR(this).html($("<div class='form-group'>")
					.append($('<div class="col-sm-3">').append($("label", this)))
					.append($('<div class="col-sm-9">').append($("*:last-child", this))));
				DOLLAR(this).append($("<div style='clear:both'>"));
			});
			DOLLAR("body > div").addClass('container');
			// DOLLAR("body > div > div");
			DOLLAR("button[id$='closeBtn']").remove();
			DOLLAR("a.reset").remove();
			DOLLAR("textarea,input").addClass('form-control');
			DOLLAR("button").addClass("btn btn-lg btn-success").text('Save');
			DOLLAR("button").on('click tap', GM_config.close.bind(GM_config));
			$("body").one('click tap', GM_config.close.bind(GM_config));
			DOLLAR("body").append(`
				<a id="restart-zotero-backend" class="btn btn-danger">Reset</a>
			 `);
			DOLLAR("#restart-zotero-backend").on('click tap', function() {
				GM_xmlhttpRequest({
					method: "GET",
					url: ZOTERO_API + '/restart',
					onload: function(response) {
						console.warn(response);
						console.warn('Notified zotero backend!');
					}
				});
			});
		}
	}
});

/**
 * Google Scholar result
 *
 */
function GoogleScholarResult(el, parent) {
	this.$el = $(el);
	var self = this;
	this.button = new InfolisButton(
		'result-list-item',
		$(".gs_rt", this.$el),
		this.$el,
		parent,
		$(".gs_rt a[href]", this.$el).attr('href')
	);
}
GoogleScholarResult.matchLocation = function() {
	return window.location.hostname.startsWith('scholar.google') || window.location.pathname.indexOf('Scholar') > -1 ;
};
GoogleScholarResult.activateResults = function(parent, eachCB, doneCB) {
	async.each($(".gs_r").get(), function(elem, cbResult) {
		var result = new GoogleScholarResult(elem, parent);
		eachCB(result, cbResult);
	}, doneCB);
};

/**
 * Primo result
 *
 */
function PrimoResult(el, parent) {
	this.$el = $(el);
	var self = this;
	this.button = new InfolisButton(
		'result-list-item',
		$(".EXLResultNumber", this.$el),
		this.$el,
		parent,
		$(".gs_rt a[href]", this.$el).attr('href')
	);
}
PrimoResult.matchLocation = function() {
	return window.location.hostname.startsWith('primo.bib.uni-mannheim.de') ||
		/primo/.test(window.location.hostname);
};
PrimoResult.activateResults = function(parent, eachCB, doneCB) {
	async.each($(".EXLResult").get(), function(elem, cbResult) {
		var result = new PrimoResult(elem, parent);
		eachCB(result, cbResult);
	}, doneCB);
};

/**
 * InfolisButton
 *
 * button_types:
 *   - landing-page
 *   - result-list
 *   - result-list-item
 *
 * statuses:
 *   - inactive
 *   - ready
 *   - working
 *   - fail
 *   - win
 */

function InfolisButton(button_type, appendContainer, highlightContainer, parent_button, href) {
	appendContainer = appendContainer || 'body';
	highlightContainer = highlightContainer || appendContainer;
	this.$appendContainer = $(appendContainer);
	this.$highlightContainer = $(highlightContainer);
	this.$el = $("<div>").appendTo(this.$appendContainer);
	var $css = $(SCOPED_CSS)[0];
	this.$el.prepend($css);
	scopedPolyFill($css);
	this.$el.append("<div class='infolis-button'>");

	this.renderCount = 0;
	this.parent_button = parent_button;
	this.status = 'inactive';
	this.button_type = button_type;
	this.expanded = false;
	this.href = href || window.location.href.replace(/#.*/, '');
	this.results = [];
	this.databases = [];
	this.publications = [];
	this.primary_data = [];
	this.datasets = [];
	this.error_message = undefined;
	this.flag_fetched = false;
	this.resultClass = null;
}

InfolisButton.prototype = {
	setStatus: function(status, message, cb) {
		this.status = status;
		if (message) {
			this.error_message = message;
		}
		this.renderPartially();
		if (cb) cb(message);
	},
	// add: function(coll, id) {
	//     // console.info(coll, id);
	//     if (this[coll].indexOf(id) > -1) {
	//         return;
	//     }
	//     this[coll].push(id);
	//     if (this.parent_button) {
	//         this.parent_button.add(coll, id);
	//     }
	//     this.render();
	// },
	show: function() {
		if (this.hidden) {
			this.$highlightContainer.fadeIn();
		}
		this.hidden = false;
	},
	hide: function() {
		if (! this.hidden) {
			this.$highlightContainer.fadeOut();
		}
		this.hidden = true;
	},
	// TODO
	prioritize: function() {
		for (var fail of GM_config.get('bad_databases').split(/\n/)) {
			if (this.databases.indexOf(fail) >= 0) {
				this.$highlightContainer.css('opacity', '0.5');
				this.$highlightContainer.css('background', '#ccc');
			}
		}
		for (var good of GM_config.get('good_databases').split(/\n/)) {
			if (this.databases.indexOf(good) >= 0) {
				this.$highlightContainer.css('border', '3px dotted green ');
				this.$highlightContainer.css('background', '#efe ');
			}
		}
	},
	list: function(coll){
		// console.debug("Listing all " + coll);
		var ret = [];
		if (coll === 'publications') {
			ret = this.publications.slice(0);
		} else {
			for (var pub of this.publications) {
				if (! pub[coll]) continue;
				for (var data of pub[coll]) {
					ret.push(data);
				}
			}
		}
		for (var result of this.results || []) {
			for (var childData of result.button.list(coll)) {
				ret.push(childData);
			}
		}
		return ret;
	},
	number_found: function() {
		var nr = 0;
		for (var coll of ['databases', 'datasets']) {
			nr += this.list(coll).length;
		}
		return nr;
	},
	fetchDOI: function(done) {
		var doi = matchCOinS_rft_dat(this.$highlightContainer.html());
		if(doi) {
			console.debug("Found DOI in Primo COinS:", doi);
			return done(null, [doi]);
		}
		doi = matchWiso(this.$highlightContainer.html());
		if(doi) {
			console.debug("Found DOI in Wiso:", doi);
			return done(null, [doi]);
		}
		if (! this.href) {
			doi = matchDOI(this.$highlightContainer.html());
			if(doi) {
				console.debug("Found DOI in containing element: ", doi);
				return done(null, [doi]);
			}
			if (! this.href) {
				console.error("Cannot determine DOI without a URI.");
				return done("Cannot determine DOI without a URI.");
			}
		}
		doi = matchDOI(this.href);
		if(doi) {
			console.debug("Found DOI in URL:", [doi]);
			return done(null, [doi]);
		} else {
			GM_xmlhttpRequest({
				method: "GET",
				url: ZOTERO_API + '?format=doi&url=' + this.href,
				onload: function(response)  {
					console.log('LOLFAG');
					if (response.status !== 200) {
						console.error(response.status);
						return done(response.status);
					}
					console.debug("Found DOI by scraping", response.responseText);
					return done(null, [response.responseText]);
				}
			});
		}
	},
	fetch: function(cbFetch) {
		var self = this;
		if (self.flag_fetched) {
			return cbFetch(null, 'Already fetched');
		}
		self.flag_fetched = true;
		if (self.button_type === 'result-list') {
			self.setStatus('working');
			async.each(self.results, function(result, done) {
				if (result.button.flag_fetched) {
					return done();
				}
				result.button.activate(function() {
					result.button.fetch(function() {
						done();
					});
				});
			}, function() {
				self.setStatus('ok');
				self.render();
				return cbFetch(null, 'Fetched all results');
			});
		} else {
			self.setStatus('working');
			self.fetchDOI(function(err, dois) {
				if (err) {
					self.setStatus('fail', "No DOI : " + err);
					return cbFetch("Can't fetch data without a DOI.");
				}
				var instantiated = [];
				async.eachSeries(dois, function(pubId, donePub) {
					DB.get('publications', pubId, function(err, pub) {
						if (err) {
							self.setStatus('fail', 'Failed to download publication data: ' + err);
						} else {
							self.setStatus('ok');
							instantiated.push(pub);
						}
						return donePub();
					});
				}, function(err) {
					self.publications = instantiated;
					self.render();
					cbFetch(null, "fetched list items");
				});
			});
		}
	},
	activate: function(cbActivate) {
		var self = this;
		if (self.status !== 'inactive') {
			return cbActivate(null, 'Already activated');
		}
		self.render();
		self.setStatus('working');
		if (self.button_type === 'result-list') {
			self.results = [];
			self.resultClass.activateResults(self, function(result, cbResult) {
				self.results.push(result);
				result.button.activate(cbResult);
			}, function() {
				self.setStatus('ready');
				cbActivate(null, 'Activated all results');
			});
		} else {
			self.setStatus('ready');
			cbActivate(null, 'Activated');
		}
	},
	unexpandAll : function() {
		SITE_BUTTON.expanded = false;
		SITE_BUTTON.results.forEach(function(result){
			result.button.expanded = false;
			result.button.renderPartially();
		});
		SITE_BUTTON.renderPartially();
	},
	unexpand : function() {
		this.expanded = true;
		this.toggleExpanded();
	},
	toggleExpanded : function() {
		var wasExpanded = this.expanded;
		this.unexpandAll();
		this.expanded = ! wasExpanded;
		this.renderPartially();
		LOG(null, 'toggled menu');
	},
	clickFetch: function() {
		console.debug('Fetching');
		this.activate(function() {
			this.fetch(LOG);
		}.bind(this));
	},
	clickLogo: function() {
		if (this.status === 'inactive') {
			return this.activate(LOG);
		} else if (this.status === 'ready') {
			this.fetch(LOG);
		} else {
			this.toggleExpanded();
		}
	},
	clickQuit: function() {
		$("style[scoped]").parent().remove();
	},
	clickConfig: function() {
		this.unexpandAll();
		GM_config.open();
	},
	toggleFilter: function() {
		if (FILTER.enabled)
			this.disableFilter();
		else
			this.enableFilter();
	},
	enableFilter: function() {
		FILTER.enabled = true;
		this.unexpandAll();
		$("#infolis-filterbox").slideDown();
		$("#filter-input").focus();
		this.updateFilter();
	},
	disableFilter: function() {
		FILTER.enabled = false;
		this.updateFilter();
		$("#filter-input").val('');
		$("#infolis-filterbox").slideUp();
	},
	updateFilter: function() {
		FILTER.text = new RegExp('.*' +  $("#filter-input").val() + '.*', 'i');
		for (var coll of ['databases', 'datasets']) {
			FILTER[coll] = $("#filter-" + coll).is(":checked");
		}
		// SITE_BUTTON.results.forEach(function(result, idx) {
			// result.button.show();
		// });
		SITE_BUTTON.results.forEach(function(result, idx) {
			if (! FILTER.enabled) {
				return result.button.show();
			}
			var coll;
			var hidden = false;
			for (coll of ['databases', 'datasets']) {
				if (FILTER[coll] && ! result.button.list(coll).length) {
					hidden = true;
				}
			}
			if (! hidden && FILTER.text) {
				hidden = true;
				for (coll of ['databases', 'datasets']) {
					for (var data of result.button.list(coll)) {
						// TODO other fields
						if (
							FILTER.text.test(data.identifier) ||
							FILTER.text.test(data.title)
						) {
							hidden = false;
							break;
						}
					}
				}
			}
			if (hidden) {
				result.button.hide();
			} else {
				result.button.show();
			}
		});
		SITE_BUTTON.renderPartially();
	},
	renderPartially: function() {
		// add class to scoped div
		if (this.button_type === 'result-list-item') {
			this.$el.css('margin-top', '20px');
			this.$el.css('z-index', '99999');
			this.$el.css('overflow', 'visible');
			this.$el.css('min-width', '64px');
			this.$el.css('float', 'left');
			this.prioritize();
		}
		if (this === SITE_BUTTON) {
			var total = this.results.length;
			var visible = total;
			this.results.forEach(function(result) {
				if (result.button.hidden) {
					visible -= 1;
				}
			});
			$("#filter-status").html(visible + " / " + total);
		}
		if (this.error_message) {
			$(".infolis-error", this.$el).html(this.error_message).toggle(true);
		}
		$(".infolis-menu:first",   this.$el).toggleClass('hidden', ! this.expanded);
		$(".infolis-button:first", this.$el).toggleClass('expanded', this.expanded);
		$(".infolis-button:first", this.$el).addClass(`infolis-${this.button_type}`);
		$(".infolis-logo:first",   this.$el).attr('data-infolis-number', this.number_found());
		$(".infolis-button:first", this.$el).attr('data-infolis-status', this.status);
		$("span.infolis-status",   this.$el).html(this.status);
		// toggle modals
		$("#btn-fetch-all",            this.$el).toggleClass('hidden', this.flag_fetched || this.button_type !== 'result-list');
		$("#filter-toggle",            this.$el).toggleClass('hidden', this.button_type !== 'result-list');
		$(".infolis-result-length",    this.$el).toggleClass('hidden', this.button_type !== 'result-list');
		$(".infolis-button-group",     this.$el).toggleClass('hidden', this.button_type === 'result-list-item');
		$(".infolis-row-databases",    this.$el).toggleClass('hidden', this.list('databases').length === 0);
		$(".infolis-row-datasets",     this.$el).toggleClass('hidden', this.list('datasets').length === 0);
		$(".infolis-row-publications", this.$el).toggleClass('hidden', this.list('publications').length === 0);
		// if(
	},
	render: function() {
		// render template
		$("div.infolis-button", this.$el).replaceWith(tpl('site_button', this));
		if (this.number_found() > 0) {
			$(".infolis-logo:not(.expanded):first", this.$el)
				.addClass('animated wobble')
				.one('animationend', function() {
					$(this).removeClass('animated wobble');
				});
		}
		this.renderPartially();
		// click/tap events
		$(".infolis-logo:first", this.$el).on('click tap', this.clickLogo.bind(this));
		$("#btn-fetch-all",      this.$el).on('click tap', this.clickFetch.bind(this));
		$("#btn-quit",           this.$el).on('click tap', this.clickQuit.bind(this));
		$("#btn-config",         this.$el).on('click tap', this.clickConfig.bind(this));
		// Filtering
		$("#filter-toggle",         this.$el).on('click tap', this.toggleFilter.bind(this));
		$("#filter-clear",          this.$el).on('click tap', this.disableFilter.bind(this));
		$("#filter-input",          this.$el).on('keyup',     this.updateFilter.bind(this));
		$("input[type='checkbox']", this.$el).on('change',    this.updateFilter.bind(this));
		$('.filter-preset').on('click tap', function() {
			var collection = $(this).closest("*[data-collection]").attr('data-collection');
			var id         = $(this).closest("*[data-collection]").attr('data-id');
			SITE_BUTTON.enableFilter();
			$("#infolis-filterbox input[type='text']").val(id);
			$("input[type='checkbox']").prop('checked', false);
			$(`#filter-${collection}`).prop('checked', true);
			SITE_BUTTON.updateFilter();
		});
		// ribbons/badges/whatever toggler
		$(".infolis-menu:first .toggle-group", this.$el).each(function(){
			var group = this;
			$(group).find('.toggle-source').on('click tap', function() {
				$(".toggle-target", group).animate({'opacity': 'toggle', 'width': 'toggle'}, 100);
			});
		});
		// biblio export
		$(".export", this.$el).on('click tap', function() {
			var format     = $(this).attr('data-export');
			var collection = $(this).closest("*[data-collection]").attr('data-collection');
			var id         = $(this).closest("*[data-collection]").attr('data-id');
			// var entry      = DB.get(collection, id);
			DB.get(collection, id, function(err, entry) {
				if (entry) {
					SITE_BUTTON.unexpandAll();
					$("#citation-window").append($("<pre>").html(htmlEncode(
						entry[`citation_${format}`] ? entry[`citation_${format}`] : JSON.stringify(entry, null ,2)
					))).show();
				}
			});
		});
	}
};


/**
 * Find links to PDF
 *
 */
function matchDOI (str) {
	var re = new RegExp(GM_config.get("regex_doi"));
	var doiMatch = str.match(re);
	if(doiMatch) {
		return doiMatch[1].replace(/(\/full|\/pdf|\/abstract|;jsessionid.*)*(\?.*)?$/, '');
	}
}
function matchCOinS_rft_dat(str) { 
	var re = /rft_dat=<wiso>([^,]*)<\/wiso>,/;
	var doiMatch = str.match(re);
	if(doiMatch) {
		return doiMatch[1];
	}
}
function matchWiso(str) { 
	if (window.location.href.match('wiso-net')) {
		return 'ZAAA2005110027513181411142812171';
	}
}

/**
 * Template function
 */

function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html();
}

function tpl(name, data) {
	var dot = GM_getResourceText(name + '.html');
	// var svgTemplate = GM_getResourceText('ribbon.html');
	// var svgTemplateCompiled = doT.template(svgTemplate);
	// data.ribbon = function(textLeft, textRight) {
	//     return encodeURIComponent(svgTemplateCompiled({
	//         'textLeft': textLeft,
	//         'textRight': textRight
	//     }));
	// };
	data.GM_config = GM_config;
	data.DB = DB;
	var html = $(doT.template(dot)(data));
	return html;
}

/**
 * Inject stylesheets
 *
 */
function addStyle(rule) {
	var style = $("#infolis-userjs-style");
	if (style.length === 0) {
		style =  $("<style id='infolis-userjs-style'/>");
		$("head").append(style);
	}
	style.append(rule);
}

/**
 * Key bindings
 *
 */
function addKeybindings() {
	document.addEventListener('keydown',  function keyHandler(e) {
		// key: <escape>
		if (e.which === 27) {
			if (GM_config.frame)
				GM_config.close();
			SITE_BUTTON.unexpandAll();
			SITE_BUTTON.disableFilter();
			$("#citation-window").hide();
			// key: <alt-c>
		} else if (e.which === "C".charCodeAt(0) && e.altKey === true) {
			SITE_BUTTON.clickConfig();
			// GM_config.open();
			// key: <alt-b>
		} else if (e.which === "B".charCodeAt(0) && e.altKey === true) {
			SITE_BUTTON.clickFetch();
			// key: <alt-v>
		} else if (e.which === "V".charCodeAt(0) && e.altKey === true) {
			$(".infolis-button").hide();
			// key: <alt-m>
		} else if (e.which === "M".charCodeAt(0) && e.altKey === true) {
			SITE_BUTTON.toggleFilter();
			// key: <alt-n>
		} else if (e.which === "N".charCodeAt(0) && e.altKey === true) {
			if (window.confirm("Really nuke the config?"))  {
				for (var id of GM_config.fields) GM_config.fields[id].value = GM_config.fields[id].default;
				GM_config.write();
			}
		}
	});
}

function addJS(name) {
	var script   = document.createElement("script");
	script.type  = "text/javascript";
	script.text  = GM_getResourceText(name);
	document.head.appendChild(script);
}
function addCSS(name) {
	var link   = document.createElement("link");
	link.rel  = "stylesheet";
	link.href  = name;
	document.head.insertBefore(link, document.head.firstChild);
}

/**
 * Main
 *
 */
function main() {
	GM_registerMenuCommand('Configure InfolisButton', GM_config.open.bind(GM_config), 'c' );
	addKeybindings();
	SITE_BUTTON = new InfolisButton();
	if (GoogleScholarResult.matchLocation()) {
		SITE_BUTTON.button_type = 'result-list';
		SITE_BUTTON.resultClass = GoogleScholarResult;
	} else if (PrimoResult.matchLocation()) {
		SITE_BUTTON.button_type = 'result-list';
		SITE_BUTTON.resultClass = PrimoResult;
	} else {
		SITE_BUTTON.button_type = 'landing-page';
	}
	SITE_BUTTON.$el.append($("<div id='citation-window'>").hide());
	SITE_BUTTON.render();
	if (GM_config.get("auto_activate")) {
		SITE_BUTTON.clickLogo();
		if (GM_config.get("auto_fetch")) {
			SITE_BUTTON.clickFetch();
		}
	}
}
addJS('scoped.js');
addCSS("https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css");
addCSS("https://jpswalsh.github.io/academicons/css/academicons.min.css");
setTimeout(main, 500);

// vim: noet sw=4 ts=4
