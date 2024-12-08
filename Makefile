.PHONY: build
build:
	docker-compose build --no-cache

.PHONY: start
start:
	docker-compose up

.PHONY: run
run:
	docker-compose build --no-cache && docker-compose up

.PHONY: stop
stop:
	docker-compose down