-- Elimina tabla y tipo si existen
drop table if exists carrera cascade;
drop type if exists estados;

-- Crea tipo ENUM
create type estados as enum ('activo', 'inactivo', 'en reposo');

-- Crea tabla principal
create table carrera (
  id bigint primary key generated always as identity not null,
  created_at timestamp default now() not null,
  name text not null,
  status estados default 'activo' not null,
  estudiantes text[] default '{}'::text[] not null,
  anio text not null,
  mes text not null
);

