###*
# Google Scholar result
#
###

class GoogleScholarResult extends EntityInDOM

	constructor: (el, parent) ->
		@$el = $(el)
		@button = new InfolisButton
			button_type: 'result-list-item'
			appendContainer: $('.gs_rt', @$el)
			highlightContainer: @$el
			parent_button: parent
			href: $('.gs_rt a[href]', @$el).attr('href')

	@matchLocation: ->
		window.location.hostname.startsWith('scholar.google') or window.location.pathname.indexOf('Scholar') > -1

	@activateResults: (parent, eachCB, doneCB) ->
		async.each $('.gs_r').get(), (elem, cbResult) ->
			result = new GoogleScholarResult(elem, parent)
			eachCB result, cbResult
		, doneCB

