--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title text NOT NULL,
    filename text NOT NULL,
    file_path text NOT NULL,
    type text,
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: duty_officers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.duty_officers (
    id integer NOT NULL,
    officer_name text,
    master_name text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    officer_id integer,
    master_id integer
);


ALTER TABLE public.duty_officers OWNER TO postgres;

--
-- Name: duty_officers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.duty_officers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.duty_officers_id_seq OWNER TO postgres;

--
-- Name: duty_officers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.duty_officers_id_seq OWNED BY public.duty_officers.id;


--
-- Name: military_personnel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.military_personnel (
    id integer NOT NULL,
    name text NOT NULL,
    rank text NOT NULL,
    type text NOT NULL,
    specialty text,
    full_rank_name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    duty_role text,
    CONSTRAINT military_personnel_type_check CHECK ((type = ANY (ARRAY['officer'::text, 'master'::text])))
);


ALTER TABLE public.military_personnel OWNER TO postgres;

--
-- Name: military_personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.military_personnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.military_personnel_id_seq OWNER TO postgres;

--
-- Name: military_personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.military_personnel_id_seq OWNED BY public.military_personnel.id;


--
-- Name: notices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notices (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notices_priority_check CHECK ((priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))
);


ALTER TABLE public.notices OWNER TO postgres;

--
-- Name: notices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notices_id_seq OWNER TO postgres;

--
-- Name: notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notices_id_seq OWNED BY public.notices.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: duty_officers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duty_officers ALTER COLUMN id SET DEFAULT nextval('public.duty_officers_id_seq'::regclass);


--
-- Name: military_personnel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.military_personnel ALTER COLUMN id SET DEFAULT nextval('public.military_personnel_id_seq'::regclass);


--
-- Name: notices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices ALTER COLUMN id SET DEFAULT nextval('public.notices_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, filename, file_path, type, upload_date, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: duty_officers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.duty_officers (id, officer_name, master_name, updated_at, officer_id, master_id) FROM stdin;
1	1T (IM) ALEXANDRIA	1SG (CL) CARLA2	2025-07-08 04:12:22.943846	10	26
\.


--
-- Data for Name: military_personnel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.military_personnel (id, name, rank, type, specialty, full_rank_name, active, created_at, updated_at, duty_role) FROM stdin;
16	ELIEZER	1t	officer	IM	1º Tenente ELIEZER	t	2025-07-03 23:47:52.31645	2025-07-06 21:36:02.743484	officer
11	TAMIRES	1t	officer	QC-IM	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
14	PINA TRIGO	1t	officer	RM2-T	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
8	MATEUS BARBOSA	ct	officer	IM	Capitão-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
9	LARISSA CASTRO	1t	officer	RM2-T	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-08 05:01:15.609301	\N
12	KARINE	1t	officer	RM2-T	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-08 04:12:47.023774	\N
15	LEONARDO ANDRADE	1t	officer	IM	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
17	MARCIO MARTINS	2t	officer	AA	Segundo-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
18	MACHADO	2t	officer	AA	Segundo-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
19	SALES	1sg	master	PL	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
20	LEANDRO	1sg	master	EP	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
22	RAFAELA	1sg	master	CL	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
23	SILVIA HELENA	1sg	master	QI	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
24	DA SILVA	1sg	master	ES	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
25	BEIRUTH	1sg	master	PD	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
27	ALICE	2sg	master	CL	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
28	DIEGO	2sg	master	ES	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
29	CANESCHE	2sg	master	EL	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
30	NIBI	2sg	master	ES	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
31	MONIQUE	2sg	master	PD	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
32	DAMASCENO	2sg	master	CL	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
33	SOUZA LIMA	2sg	master	BA	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
34	SANT'ANNA	2sg	master	MO	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
35	AFONSO	2sg	master	SI	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
36	MEIRELES	2sg	master	MR	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
37	BRUNA ROCHA	2sg	master	PD	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
38	ARIANNE	2sg	master	AD	Segundo-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
39	MAYARA	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
13	RONALD CHAVES	1t	officer	AA	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
21	ELIANE	1sg	master	CL	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
10	ALEXANDRIA	1t	officer	IM	Primeiro-Tenente	t	2025-07-03 23:47:52.31645	2025-07-08 05:31:03.086336	\N
40	MÁRCIA	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
41	JUSTINO	3sg	master	OS	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
42	JONAS	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
44	SABRINA	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
45	TAINÁ NEVES	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
46	AMANDA PAULINO	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
47	ANA BEATHRIZ	3sg	master	AD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
48	KEVIN	3sg	master	MO	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
49	JORGE	3sg	master	CI	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
50	ALAN	3sg	master	BA	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
51	HUGO	3sg	master	EL	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
52	FERNANDES	3sg	master	AM	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
53	LUCAS SANTOS	3sg	master	AM	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	\N
26	CARLA	1sg	master	CL	Primeiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-08 10:33:28.291397	\N
7	YAGO	ct	officer	IM	Capitão-Tenente	f	2025-07-03 23:47:52.31645	2025-08-25 19:08:04.575806	\N
43	THAÍS SILVA	3sg	master	PD	Terceiro-Sargento	t	2025-07-03 23:47:52.31645	2025-07-03 23:47:52.31645	master
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notices (id, title, content, priority, start_date, end_date, active, created_at, updated_at) FROM stdin;
4	ADE de tiro, programado para o 1°T do dia 27AGO	Atenção aos Escalados	high	2025-08-25 20:03:59.494	2025-08-26 21:00:00	t	2025-08-25 20:04:22.013544	2025-08-25 20:04:22.013544
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, active, created_at, updated_at) FROM stdin;
\.


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- Name: duty_officers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.duty_officers_id_seq', 1, true);


--
-- Name: military_personnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.military_personnel_id_seq', 53, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notices_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: duty_officers duty_officers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duty_officers
    ADD CONSTRAINT duty_officers_pkey PRIMARY KEY (id);


--
-- Name: military_personnel military_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.military_personnel
    ADD CONSTRAINT military_personnel_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: duty_officers duty_officers_master_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duty_officers
    ADD CONSTRAINT duty_officers_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.military_personnel(id);


--
-- Name: duty_officers duty_officers_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duty_officers
    ADD CONSTRAINT duty_officers_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.military_personnel(id);


--
-- PostgreSQL database dump complete
--

