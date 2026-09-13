import * as UECA from "ueca-react";
import { Button, ButtonModel, Icon, NavLink, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useUIBase } from "@components";
import { AppRoute, ArrowRightIcon, GitHubIcon, IconName, OtherRoute } from "@core";
import { PLAYGROUND_TOPICS } from "../../playground/playgroundTopics";
import { SHOWCASE_TOPICS } from "../../showcase/showcaseTopics";
import "./homeHero.css";

// The landing page. Its centrepiece is the struct spine: UECA's claim is that every component has
// the same six sections in the same order, and this app is some fifty components written that way —
// so the shape of a component is the pitch, and the Showcase and the Playground are the evidence.
// Layout and voice follow the documentation site's home page.
type HomeHeroStruct = UIBaseStruct<{
    props: {
        version: string;
    };

    children: {
        showcaseButton: ButtonModel;
        playgroundButton: ButtonModel;
        sourceButton: ButtonModel;
    };

    methods: {
        open: (url: OtherRoute["path"]) => Promise<void>;
        _CardsView: (props: { cards: HomeCard[] }) => UECA.ReactElement;
    };
}>;

type HomeHeroParams = UIBaseParams<HomeHeroStruct>;
type HomeHeroModel = UIBaseModel<HomeHeroStruct>;

// A page the landing page links to.
type HomeCard = {
    id: string;
    title: string;
    summary: string;
    icon: IconName;
    route: AppRoute;
};

// The fixed order, and what each section answers. This is the signature element — the one place the
// page raises its voice — so everything around it stays quiet.
const SECTIONS: { name: string; role: string }[] = [
    { name: "props", role: "the state it holds" },
    { name: "children", role: "the models it owns" },
    { name: "methods", role: "what it can be asked to do" },
    { name: "events", role: "what it reports upward" },
    { name: "messages", role: "what it answers on the bus" },
    { name: "View", role: "what it draws" }
];

// Built once from the topic lists — the same lists the menu and the routes read — so a card's
// route keeps its identity across renders and a new page shows up here without an edit. The
// Overview is about the showcase rather than a part of it, so it is the section's intro link, not
// a card.
const SHOWCASE_CARDS: HomeCard[] = SHOWCASE_TOPICS.filter((t) => t.key !== "overview").map((t) => ({
    id: `home-showcase-${t.key}`,
    title: t.title,
    summary: t.summary,
    icon: t.icon,
    route: { path: t.path } as AppRoute
}));

const OVERVIEW_ROUTE: AppRoute = { path: "/showcase/overview" };

const PLAYGROUND_CARDS: HomeCard[] = PLAYGROUND_TOPICS.map((t) => ({
    id: `home-playground-${t.key}`,
    title: t.title,
    summary: t.summary,
    icon: t.icon,
    route: { path: t.path } as AppRoute
}));

const PRINCIPLES: { title: string; body: string }[] = [
    {
        title: "No UI library",
        body: "Plain HTML, CSS and SVG. Every control in the app is a UECA component of its own, in src/components."
    },
    {
        title: "Two themes, one set of tokens",
        body: "Light and dark differ only in their colour tokens. No component names a colour, so none needs a dark variant."
    },
    {
        title: "Services on the bus",
        body: "Dialogs, alerts, routing and the theme are components reached by message — no screen imports them."
    }
];

const DEMOS: { id: string; name: string; note: string; demo?: OtherRoute["path"]; source: OtherRoute["path"] }[] = [
    {
        id: "demo1",
        name: "MUI components",
        note: "The Material UI library wrapped in UECA models.",
        demo: "https://nekutuzov.github.io/ueca-react-app-demo1",
        source: "https://github.com/nekutuzov/ueca-react-app-demo1"
    },
    {
        id: "demo2",
        name: "This showcase",
        note: "A component library on plain HTML and CSS, in light and dark.",
        source: "https://github.com/nekutuzov/ueca-react-app-demo2"
    },
    {
        id: "doc",
        name: "Documentation",
        note: "The guide and the API reference, built on UECA-React itself.",
        demo: "https://nekutuzov.github.io/ueca-react-doc/",
        source: "https://github.com/nekutuzov/ueca-react-doc"
    }
];

function useHomeHero(params?: HomeHeroParams): HomeHeroModel {
    const struct: HomeHeroStruct = {
        props: {
            id: useHomeHero.name,
            version: undefined
        },

        children: {
            showcaseButton: useButton({
                contentView: "Browse the showcase",
                variant: "contained",
                endIconView: <ArrowRightIcon size={15} />,
                onClick: async () => {
                    await model.goToRoute({ path: "/showcase/overview" });
                }
            }),

            playgroundButton: useButton({
                contentView: "Open the playground",
                variant: "outlined",
                onClick: async () => {
                    await model.goToRoute({ path: "/playground/button" });
                }
            }),

            sourceButton: useButton({
                contentView: "GitHub",
                variant: "outlined",
                startIconView: <GitHubIcon size={15} />,
                onClick: async () => await model.open("https://github.com/nekutuzov/ueca-react-app-demo2")
            })
        },

        methods: {
            open: async (url) => {
                await model.openNewTab({ path: url });
            },

            _CardsView: ({ cards }) => (
                <ul className="home-cards">
                    {cards.map((card) => (
                        <li key={card.id} className="home-card-item">
                            <NavLink
                                id={card.id}
                                route={card.route}
                                color={"text.primary"}
                                underline={"none"}
                                linkView={
                                    <span className="home-card">
                                        <span className="home-card-icon">
                                            <Icon name={card.icon} size="lg" />
                                        </span>
                                        <span className="home-card-text">
                                            <span className="home-card-title">{card.title}</span>
                                            <span className="home-card-summary">{card.summary}</span>
                                        </span>
                                    </span>
                                }
                            />
                        </li>
                    ))}
                </ul>
            )
        },

        init: async () => {
            const info = await model.bus.unicast("App.GetInfo");
            model.version = info?.appVersion;
        },

        View: () => (
            <div id={model.htmlId()} className="home">

                {/* ---- Hero ---- */}
                <header className="home-hero">
                    <div className="home-eyebrow ueca-eyebrow">
                        UECA-React {model.version} · Showcase
                    </div>
                    <h1 className="home-headline">
                        Fifty components.<br />One component shape.
                    </h1>
                    <p className="home-lead">
                        A working application written in UECA-React on plain HTML, CSS and SVG. The Showcase
                        lays every component out in whichever theme is active; the Playground puts one on a
                        workbench, where its properties and its source change together.
                    </p>
                    <div className="home-actions">
                        <model.showcaseButton.View />
                        <model.playgroundButton.View />
                        <model.sourceButton.View />
                    </div>
                </header>

                {/* ---- The signature: one component, always this shape ---- */}
                <section className="home-spine-block" aria-label="The shape of a UECA component">
                    <div className="home-spine-caption ueca-eyebrow">Every component, this exact shape</div>
                    <ol className="home-spine">
                        {SECTIONS.map((s) => (
                            <li key={s.name} className="home-spine-row">
                                <span className="home-spine-name">{s.name}</span>
                                <span className="home-spine-role">{s.role}</span>
                            </li>
                        ))}
                    </ol>
                    <p className="home-spine-note">
                        The table, the select and the sidebar you are looking at are all declared this way. Read
                        one and you can read them all.
                    </p>
                </section>

                {/* ---- Showcase ---- */}
                <section className="home-section" aria-labelledby="home-showcase-heading">
                    <div className="home-section-head">
                        <h2 id="home-showcase-heading" className="home-h2">Showcase</h2>
                        <span className="home-section-count ueca-eyebrow">{SHOWCASE_CARDS.length} topics</span>
                    </div>
                    <p className="home-section-lead">
                        Every component side by side, in every variant and state, against the active theme.
                        New here? Start with the{" "}
                        <NavLink
                            id={"home-showcase-overview"}
                            route={OVERVIEW_ROUTE}
                            underline={"always"}
                            linkView={"overview"}
                        />.
                    </p>
                    <model._CardsView cards={SHOWCASE_CARDS} />
                </section>

                {/* ---- Playground ---- */}
                <section className="home-section" aria-labelledby="home-playground-heading">
                    <div className="home-section-head">
                        <h2 id="home-playground-heading" className="home-h2">Playground</h2>
                        <span className="home-section-count ueca-eyebrow">{PLAYGROUND_CARDS.length} editors</span>
                    </div>
                    <p className="home-section-lead">
                        One component at a time: change a property and the live instance and its code follow.
                    </p>
                    <model._CardsView cards={PLAYGROUND_CARDS} />
                </section>

                {/* ---- Principles ---- */}
                <section className="home-section" aria-labelledby="home-principles-heading">
                    <div className="home-section-head">
                        <h2 id="home-principles-heading" className="home-h2">How it is built</h2>
                    </div>
                    <div className="home-principles">
                        {PRINCIPLES.map((p) => (
                            <article key={p.title} className="home-principle">
                                <h3 className="home-principle-title">{p.title}</h3>
                                <p className="home-principle-body">{p.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---- Demos ---- */}
                <section className="home-section" aria-labelledby="home-demos-heading">
                    <div className="home-section-head">
                        <h2 id="home-demos-heading" className="home-h2">Live demos</h2>
                    </div>
                    <ul className="home-demos">
                        {DEMOS.map((d) => (
                            <li key={d.id} className="home-demo">
                                <div className="home-demo-text">
                                    <span className="home-demo-name">{d.name}</span>
                                    <span className="home-demo-note">{d.note}</span>
                                </div>
                                <div className="home-demo-links">
                                    {d.demo
                                        ? (
                                            <Button
                                                id={`home-demo-${d.id}-open`}
                                                contentView={"Open demo"}
                                                variant={"outlined"}
                                                size={"small"}
                                                onClick={async () => await model.open(d.demo)}
                                            />
                                        )
                                        : <span className="home-demo-here ueca-eyebrow">You are here</span>}
                                    <Button
                                        id={`home-demo-${d.id}-source`}
                                        contentView={"Source"}
                                        variant={"outlined"}
                                        size={"small"}
                                        onClick={async () => await model.open(d.source)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const HomeHero = UECA.getFC(useHomeHero);

export { HomeHeroParams, HomeHeroModel, useHomeHero, HomeHero };
