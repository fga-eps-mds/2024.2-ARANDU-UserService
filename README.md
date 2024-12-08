# 2024.2-ARANDU-UserService

<div align="center">
     <img src="assets/arandu-logo.svg" height="350px" width="350px">
</div>

## Sobre

Arandu é uma plataforma de aprendizado, 100% feita por estudantes da UnB, projetada para tornar o estudo de várias disciplinas escolares uma experiência envolvente e eficaz. Inspirado nos modelos de sucesso do Duolingo e Brilliant, o Arandu oferece uma abordagem inovadora para o aprendizado de matérias escolares, tornando-o acessível, divertido e altamente personalizado.

## Quality Control

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fga-eps-mds_2024.2-ARANDU-UserService&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=fga-eps-mds_2024.2-ARANDU-UserService)

## Requisitos

- Node.js 22
- Docker
- Docker-compose

### Instalação

```bash
# 1. Clone o projeto
git clone https://github.com/fga-eps-mds/2024.2-ARANDU-UserService.git

# 2. Entre na pasta do projeto
cd 2024.2-ARANDU-UserService

npm i

cp .env.dev .env

# Rode o docker compose do projeto
docker-compose up --build
    # --build somente eh necessario na primeira vez que estiver rodando
    # depois `docker-compose up` ja resolve
    # em linux talvez seja necessario a execucao em modo root `sudo docker-compose up`
    # voce pode também caso queria adicionar um -d ao final para liberar o o terminal `docker-compose up -d`
    # Para finalizar o servico execute no root do projeto `docker-compose down`

```

## Contribuir

Para contribuir com esse projeto é importante seguir nosso [Guia de Contribuição](https://fga-eps-mds.github.io/2024.2-ARANDU-DOC/guias/guia_de_contribuicao/) do repositório e seguir nosso [Código de Conduta](https://github.com/fga-eps-mds/2024.2-ARANDU-DOC/blob/main/CODE_OF_CONDUCT.md).

## Ambientes

- [2024.2-ARANDU-Frontend](https://github.com/fga-eps-mds/2024.2-ARANDU-Frontend)
- [2024.2-ARANDU-StudioMaker](https://github.com/fga-eps-mds/2024.2-ARANDU-StudioMaker)
- [2024.2-ARANDU-UserService](https://github.com/fga-eps-mds/2024.2-ARANDU-UserService)
- [2024.2-ARANDU-APP](https://github.com/fga-eps-mds/2024.2-ARANDU-APP)
