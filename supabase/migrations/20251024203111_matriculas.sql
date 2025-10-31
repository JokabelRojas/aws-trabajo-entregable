-- === ACADEMIC YEARS ===
create table if not exists academic_years (
  id           bigserial primary key,
  year_label   int not null,
  starts_on    date,
  ends_on      date,
  status       varchar(20) not null default 'open',  -- 'open' | 'closed'
  created_at   timestamp not null default now(),
  updated_at   timestamp not null default now(),
  constraint ux_academic_years_year_label unique (year_label)
);

-- === TEACHERS ===
create table if not exists teachers (
  id           bigserial primary key,
  full_name    varchar(120) not null,
  email        varchar(160),
  phone        varchar(40),
  created_at   timestamp not null default now(),
  updated_at   timestamp not null default now()
);

-- === STUDENTS ===
create table if not exists students (
  id             bigserial primary key,
  dni            varchar(12),
  full_name      varchar(120) not null,
  birth_date     date,
  guardian_name  varchar(120),
  guardian_phone varchar(40),
  created_at     timestamp not null default now(),
  updated_at     timestamp not null default now()
);

-- === CLASSROOMS ===
create table if not exists classrooms (
  id                   bigserial primary key,
  academic_year_id     bigint not null references academic_years(id) on delete restrict,
  grade_level          int not null check (grade_level between 1 and 5),
  section              varchar(5) not null,      -- 'A','B','C',...
  teacher_ids          bigint[] ,                -- opcional: docentes asociados al aula
  homeroom_teacher_id  bigint references teachers(id) on delete set null,
  created_at           timestamp not null default now(),
  updated_at           timestamp not null default now(),
  constraint ux_classrooms_year_grade_section unique (academic_year_id, grade_level, section)
);
-- índice auxiliar para FK compuesta (id, academic_year_id)
create unique index if not exists ux_classrooms_id_year on classrooms(id, academic_year_id);

-- === COURSES ===
create table if not exists courses (
  id           bigserial primary key,
  name         varchar(100) not null,
  code         varchar(20),
  created_at   timestamp not null default now(),
  updated_at   timestamp not null default now()
);
create unique index if not exists ux_courses_code on courses(code) where code is not null;

-- === COURSE OFFERINGS (qué curso imparte qué docente a qué aula) ===
create table if not exists course_offerings (
  id           bigserial primary key,
  classroom_id bigint not null references classrooms(id) on delete cascade,
  course_id    bigint not null references courses(id) on delete restrict,
  teacher_id   bigint not null references teachers(id) on delete restrict,
  created_at   timestamp not null default now(),
  updated_at   timestamp not null default now(),
  constraint ux_course_offerings unique (classroom_id, course_id)
);

-- === SCHEDULES (horario por oferta) ===
create table if not exists schedules (
  id                 bigserial primary key,
  course_offering_id bigint not null references course_offerings(id) on delete cascade,
  day_of_week        varchar(3) not null check (day_of_week in ('MON','TUE','WED','THU','FRI')),
  starts_at          time not null,
  ends_at            time not null,
  room               varchar(30),
  created_at         timestamp not null default now(),
  updated_at         timestamp not null default now(),
  constraint chk_time_range check (ends_at > starts_at),
  constraint ux_schedules unique (course_offering_id, day_of_week, starts_at, ends_at)
);

-- === ENROLLMENTS (MATRÍCULAS) ===
-- ✔ año académico se conecta a la matrícula (NO al estudiante)
-- ✔ 1 matrícula por estudiante por año
-- ✔ aula debe ser del mismo año (FK compuesta)
create table if not exists enrollments (
  id               bigserial primary key,
  student_id       bigint not null references students(id) on delete cascade,
  academic_year_id bigint not null references academic_years(id) on delete restrict,
  classroom_id     bigint not null,
  status           varchar(12) not null default 'active' check (status in ('active','withdrawn','transferred')),
  enrolled_at      date not null default now(),
  created_at       timestamp not null default now(),
  updated_at       timestamp not null default now(),
  constraint ux_enrollment_student_year unique (student_id, academic_year_id),
  constraint fk_enroll_classroom_year
    foreign key (classroom_id, academic_year_id)
    references classrooms (id, academic_year_id)
      on update cascade on delete restrict
);

-- índices útiles
create index if not exists ix_enrollments_student   on enrollments(student_id);
create index if not exists ix_enrollments_year      on enrollments(academic_year_id);
create index if not exists ix_enrollments_classroom on enrollments(classroom_id);
