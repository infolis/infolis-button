'use strict'
@$ = @jQuery = jQuery.noConflict(true)

###
#
# http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0117619
#
###

SITE_BUTTON = undefined
STATUSES = [
	'inactive'
	'ready'
	'working'
	'ok'
	'fail'
]
FILTER =
	enabled: false
	text: ''


###*
# Main
#
###

main = ->
	window.DB = new SimpleApi(JSON.parse(GM_getResourceText('data.json')))
	addJS 'scoped.js'
	addCSS 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css'
	addCSS 'https://jpswalsh.github.io/academicons/css/academicons.min.css'
	GM_registerMenuCommand 'Configure InfolisButton', GM_config.open.bind(GM_config), 'c'
	addKeybindings()
	SITE_BUTTON = new InfolisButton({})
	if GoogleScholarResult.matchLocation()
		SITE_BUTTON.button_type = 'result-list'
		SITE_BUTTON.resultClass = GoogleScholarResult
	else if PrimoResult.matchLocation()
		SITE_BUTTON.button_type = 'result-list'
		SITE_BUTTON.resultClass = PrimoResult
	else
		SITE_BUTTON.button_type = 'landing-page'
	SITE_BUTTON.$el.append $('<div id=\'citation-window\'>').hide()
	SITE_BUTTON.render()
	if GM_config.get('auto_activate')
		SITE_BUTTON.clickLogo()
		if GM_config.get('auto_fetch')
			SITE_BUTTON.clickFetch()
setTimeout main, 500
# vim: noet sw=4 ts=4
