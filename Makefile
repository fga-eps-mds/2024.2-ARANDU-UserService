.PHONY: build
build:
	npm install && docker-compose build

.PHONY: start
start:
	docker-compose up

.PHONY: run
run:
	npm install & docker-compose up --build

.PHONY: stop
stop:
	docker-compose down