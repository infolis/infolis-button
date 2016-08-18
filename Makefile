PATH := ./node_modules/.bin:$(PATH)
PORT = 8080
COFFEE_COMPILE = coffee -cpb
# ASSET_SERVER := https://www-test.bib.uni-mannheim.de/infolis/infolis-button
ASSET_SERVER := http://localhost:$(PORT)
VERSION := 0.$(shell date -Iseconds)

SRC_COFFEE =\
			src/globals.coffee \
			src/simple-api.coffee \
			src/config.coffee \
			src/key-bindings.coffee \
			src/infolis-button.coffee \
			src/scholar-result.coffee \
			src/primo-result.coffee \
			src/utils.coffee \
			src/user.js.coffee
META = src/meta.js

infolis-button.user.js: $(SRC_COFFEE) $(META)
	sed \
		-e 's,{{ ASSET_SERVER }},$(ASSET_SERVER),g' \
		-e 's,{{ VERSION }},$(VERSION),g' \
		$(META) > "$@"
	$(COFFEE_COMPILE) $(SRC_COFFEE) >> "$@"

serve:
	python2 -m SimpleHTTPServer $(PORT)

watch-pug:
	pug -w -P -o tpl pug

watch-coffee:
	nodemon -w src -w tpl -e coffee,js,html -x make infolis-button.user.js
