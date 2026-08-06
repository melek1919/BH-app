--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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

--
-- Name: flag_contrat_a_reinjecter(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.flag_contrat_a_reinjecter() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.statut_injection = 'injecte' AND (
        NEW.numero_police IS DISTINCT FROM OLD.numero_police OR
        NEW.validite_du IS DISTINCT FROM OLD.validite_du OR
        NEW.validite_au IS DISTINCT FROM OLD.validite_au OR
        NEW.etablissement_id IS DISTINCT FROM OLD.etablissement_id
    ) THEN
        NEW.statut_injection := 'a_reinjecter';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: flag_contrat_vehicule_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.flag_contrat_vehicule_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    cible_contrat_id INTEGER;
BEGIN
    cible_contrat_id := COALESCE(NEW.contrat_id, OLD.contrat_id);
    UPDATE contrat
       SET statut_injection = 'a_reinjecter'
     WHERE id = cible_contrat_id AND statut_injection = 'injecte';
    RETURN NULL; -- trigger AFTER, valeur de retour ignorÃ©e
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contrat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrat (
    id integer NOT NULL,
    etablissement_id integer NOT NULL,
    numero_police character varying(50) NOT NULL,
    validite_du date NOT NULL,
    validite_au date NOT NULL,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    statut_injection character varying(20) DEFAULT 'a_injecter'::character varying NOT NULL,
    date_derniere_injection timestamp without time zone,
    numero_lot integer,
    CONSTRAINT contrat_check CHECK ((validite_au >= validite_du)),
    CONSTRAINT contrat_statut_check CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'suspendu'::character varying])::text[]))),
    CONSTRAINT contrat_statut_injection_check CHECK (((statut_injection)::text = ANY ((ARRAY['a_injecter'::character varying, 'injecte'::character varying, 'a_reinjecter'::character varying])::text[])))
);


--
-- Name: contrat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contrat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contrat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contrat_id_seq OWNED BY public.contrat.id;


--
-- Name: etablissement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etablissement (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    adresse character varying(255),
    gouvernorat character varying(100),
    identifiant_unique character varying(50) NOT NULL,
    telephone character varying(20),
    responsable_parc_auto character varying(255),
    mobile character varying(20),
    email character varying(255),
    code_fiabilisation character(1),
    statut_gias_prod character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT etablissement_code_fiabilisation_check CHECK ((code_fiabilisation = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar, 'M'::bpchar])))
);


--
-- Name: etablissement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.etablissement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: etablissement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.etablissement_id_seq OWNED BY public.etablissement.id;


--
-- Name: lot_injection_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lot_injection_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe_hash character varying(255) NOT NULL,
    role character varying(30) DEFAULT 'agent'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    prenom character varying(100),
    tel character varying(20),
    actif boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_utilisateur_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'gestion_etablissement'::character varying, 'gestion_vehicule'::character varying, 'gestion_globale'::character varying, 'guest'::character varying])::text[])))
);


--
-- Name: utilisateur_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utilisateur_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utilisateur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utilisateur_id_seq OWNED BY public.utilisateur.id;


--
-- Name: vehicule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicule (
    id integer NOT NULL,
    immatriculation character varying(150),
    usage character varying(150),
    type_vehicule character varying(150),
    numero_serie character varying(150),
    bonus_malus character varying(20),
    marque character varying(100),
    puissance numeric(6,2),
    pvid numeric(12,2),
    ptac numeric(6,2),
    nb_places integer,
    dmc date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    statut_retrait character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    date_retrait timestamp without time zone,
    motif_retrait character varying(255),
    contrat_id integer NOT NULL,
    CONSTRAINT vehicule_statut_retrait_check CHECK (((statut_retrait)::text = ANY ((ARRAY['actif'::character varying, 'retire'::character varying])::text[])))
);


--
-- Name: vehicule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicule_id_seq OWNED BY public.vehicule.id;


--
-- Name: contrat id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrat ALTER COLUMN id SET DEFAULT nextval('public.contrat_id_seq'::regclass);


--
-- Name: etablissement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement ALTER COLUMN id SET DEFAULT nextval('public.etablissement_id_seq'::regclass);


--
-- Name: utilisateur id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur ALTER COLUMN id SET DEFAULT nextval('public.utilisateur_id_seq'::regclass);


--
-- Name: vehicule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicule ALTER COLUMN id SET DEFAULT nextval('public.vehicule_id_seq'::regclass);


--
-- Name: contrat contrat_numero_police_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrat
    ADD CONSTRAINT contrat_numero_police_key UNIQUE (numero_police);


--
-- Name: contrat contrat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrat
    ADD CONSTRAINT contrat_pkey PRIMARY KEY (id);


--
-- Name: etablissement etablissement_identifiant_unique_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement
    ADD CONSTRAINT etablissement_identifiant_unique_key UNIQUE (identifiant_unique);


--
-- Name: etablissement etablissement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement
    ADD CONSTRAINT etablissement_pkey PRIMARY KEY (id);


--
-- Name: utilisateur uq_utilisateur_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT uq_utilisateur_email UNIQUE (email);


--
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: vehicule vehicule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicule
    ADD CONSTRAINT vehicule_pkey PRIMARY KEY (id);


--
-- Name: idx_contrat_etablissement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contrat_etablissement_id ON public.contrat USING btree (etablissement_id);


--
-- Name: idx_contrat_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contrat_statut ON public.contrat USING btree (statut);


--
-- Name: idx_etablissement_gouvernorat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_etablissement_gouvernorat ON public.etablissement USING btree (gouvernorat);


--
-- Name: idx_etablissement_statut_gias_prod; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_etablissement_statut_gias_prod ON public.etablissement USING btree (statut_gias_prod);


--
-- Name: idx_vehicule_contrat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicule_contrat_id ON public.vehicule USING btree (contrat_id);


--
-- Name: idx_vehicule_numero_serie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicule_numero_serie ON public.vehicule USING btree (numero_serie);


--
-- Name: idx_vehicule_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicule_statut ON public.vehicule USING btree (statut_retrait);


--
-- Name: contrat trg_contrat_flag_reinjection; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contrat_flag_reinjection BEFORE UPDATE ON public.contrat FOR EACH ROW EXECUTE FUNCTION public.flag_contrat_a_reinjecter();


--
-- Name: contrat trg_contrat_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contrat_updated_at BEFORE UPDATE ON public.contrat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: etablissement trg_etablissement_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_etablissement_updated_at BEFORE UPDATE ON public.etablissement FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: utilisateur trg_utilisateur_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_utilisateur_updated_at BEFORE UPDATE ON public.utilisateur FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vehicule trg_vehicule_flag_reinjection; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vehicule_flag_reinjection AFTER INSERT OR DELETE OR UPDATE ON public.vehicule FOR EACH ROW EXECUTE FUNCTION public.flag_contrat_vehicule_change();


--
-- Name: vehicule trg_vehicule_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vehicule_updated_at BEFORE UPDATE ON public.vehicule FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contrat contrat_etablissement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrat
    ADD CONSTRAINT contrat_etablissement_id_fkey FOREIGN KEY (etablissement_id) REFERENCES public.etablissement(id) ON DELETE CASCADE;


--
-- Name: vehicule vehicule_contrat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicule
    ADD CONSTRAINT vehicule_contrat_id_fkey FOREIGN KEY (contrat_id) REFERENCES public.contrat(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

-- ============================================================
-- SEED : compte administrateur initial
-- Mot de passe : celui défini à la création du compte (hash préservé)
-- ============================================================
--
INSERT INTO public.utilisateur (id, nom, prenom, email, tel, mot_de_passe_hash, role, actif, created_at, updated_at)
VALUES (1, 'Ben Ali', 'Ahmed', 'ahmed.benali@bh.tn', '', '$2b$12$dMHrg69nJn/ampLfkmep.OzWfWQQKWUI9bQxzDtmZ1CCGkypuCgwS', 'admin', true, now(), now())
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.utilisateur_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.utilisateur), 1), true);
