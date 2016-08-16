###*
# Primo result
#
###

class PrimoResult extends EntityInDOM

	@matchLocation: ->
		window.location.hostname.startsWith('primo.bib.uni-mannheim.de') or /primo/.test(window.location.hostname)

	@activateResults: (parent, eachCB, doneCB) ->
		async.each $('.EXLResult').get(), (elem, cbResult) ->
			result = new PrimoResult(elem, parent)
			eachCB result, cbResult
		, doneCB

	constructor: (el, parent) ->
		@$el = $(el)
		@button = new InfolisButton(
			button_type: 'result-list-item'
			appendContainer: $('.EXLResultNumber', @$el)
			highlightContainer: @$el
			parent_button: parent
			href: $('.gs_rt a[href]', @$el).attr('href')
		)
