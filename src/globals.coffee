console.log 'start infolis user.js'

SCRIPT_ID = 'InfolisButtonConfig'
ZOTERO_API = 'http://data.bib.uni-mannheim.de/zotero/simple/'
BUTTON_DATA_API = 'http://infolis.gesis.org/infolink/simple/links'
CONFIG_CSS = """
	SCRIPT_ID {
		color: white;
		background:
		linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ),
		url(https://raw.githubusercontent.com/infolis/infolis.github.io/master/img/visualize-links_01.png) ;
	}
	SCRIPT_ID textarea { font-family: monospace; }
	SCRIPT_ID h2,h3 { text-align: center; }
	SCRIPT_ID input[type="text"] { font-family: monospace; }
""".replace(/SCRIPT_ID/gm, "##{SCRIPT_ID}")
CONFIG_FRAME_STYLE = """
	bottom: auto;
	border: 1px solid #000;
	display: none;
	height: 75%;
	top: 50px;
	left: 20px;
	bottom: 50px;
	margin: 0;
	max-height: 95%;
	width: 90%;
	overflow: auto;
	padding: 0;
	position: fixed;
	right: auto;
	z-index: 9999;
	opacity: 1
""".replace(/\n\s*/g, ';')
SCOPED_CSS = """
<style scoped>
	* {
		margin: 0;
		padding: 0;
		border: 0;
		/*background: initial;*/
		/*color: initial;*/
	}
	#{GM_getResourceText('animate.css')}
	#{GM_getResourceText('marx.css')}
	#{GM_getResourceText('bootstrap.css')}
	#{GM_getResourceText('infolis.css')}
</style>
"""
