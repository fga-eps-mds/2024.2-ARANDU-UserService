.PHONY: build
build:
	npm install && docker-compose build --no-cache

.PHONY: start
start:
	docker-compose up

.PHONY: run
run:
	npm install & docker-compose build --no-cache && docker-compose up

.PHONY: stop
stop:
	docker-compose down