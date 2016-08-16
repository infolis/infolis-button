LOG = ->
	if arguments[0]
		console.error arguments[0]
	else if arguments[1]
		console.info arguments[1]

###*
# Find links to PDF
#
###

matchDOI = (str) ->
	re = new RegExp(GM_config.get('regex_doi'))
	doiMatch = str.match(re)
	if doiMatch
		return doiMatch[1].replace(/(\/full|\/pdf|\/abstract|;jsessionid.*)*(\?.*)?$/, '')

matchCOinS_rft_dat = (str) ->
	re = /rft_dat=<wiso>([^,]*)<\/wiso>,/
	doiMatch = str.match(re)
	if doiMatch
		return doiMatch[1]

matchWiso = (str) ->
	if window.location.href.match('wiso-net')
		return 'ZAAA2005110027513181411142812171'


###*
# Template function
###

htmlEncode = (value) ->
	#create a in-memory div, set it's inner text(which jQuery automatically encodes)
	#then grab the encoded contents back out.  The div never exists on the page.
	$('<div/>').text(value).html()

tpl = (name, data) ->
	dot = GM_getResourceText(name + '.html')
	# var svgTemplate = GM_getResourceText('ribbon.html');
	# var svgTemplateCompiled = doT.template(svgTemplate);
	# data.ribbon = function(textLeft, textRight) {
	#     return encodeURIComponent(svgTemplateCompiled({
	#         'textLeft': textLeft,
	#         'textRight': textRight
	#     }));
	# };
	console.log(data)
	data.GM_config = GM_config
	html = $(doT.template(dot)(data))
	html

###*
# Inject stylesheets
#
###

addStyle = (rule) ->
	style = $('#infolis-userjs-style')
	if style.length == 0
		style = $('<style id=\'infolis-userjs-style\'/>')
		$('head').append style
	style.append rule

addJS = (name) ->
	script = document.createElement('script')
	script.type = 'text/javascript'
	script.text = GM_getResourceText(name)
	document.head.appendChild script

addCSS = (name) ->
	link = document.createElement('link')
	link.rel = 'stylesheet'
	link.href = name
	document.head.insertBefore link, document.head.firstChild

