import { useEffect, useState } from "react";
import ModelViewer from "./ModelViewer.jsx";
import {
  SITE_BASE,
  SITE_URL,
  asset,
  href,
  company,
  navigation,
  services,
  concepts,
  process,
  articles,
  pageMeta,
} from "./siteData.js";

function currentPath() {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname
    .replace(SITE_BASE, "/")
    .replace(/index\.html$/, "");
  return path.endsWith("/") ? path : `${path}/`;
}
function Arrow({ diagonal = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function Link({ to = "/", children, className = "", ...rest }) {
  return (
    <a href={href(to)} className={className} {...rest}>
      {children}
    </a>
  );
}
function ButtonLink({
  to = "/contacts/",
  children = "Обсудить объект",
  light = false,
  secondary = false,
}) {
  return (
    <Link
      to={to}
      className={`button ${light ? "button-light" : ""} ${secondary ? "button-secondary" : ""}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}
function Brand({ footer = false }) {
  return (
    <Link
      className={`brand ${footer ? "brand-footer" : ""}`}
      to="/"
      aria-label="ТСК ФОРТ — главная"
    >
      <img
        src={asset("assets/tsk-fort-logo.png")}
        width="576"
        height="344"
        alt="ТСК ФОРТ — строительная компания"
      />
    </Link>
  );
}
function Header({ path }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        document.querySelector(".menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <div className="header-main container">
        <Brand />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {navigation.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              aria-current={path === to ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <a className="header-phone" href={`tel:${company.tel}`}>
          {company.phone}
          <span>Обсудить задачу</span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
        >
          {open ? (
            "✕"
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7h18M3 12h18M3 17h18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>
      </div>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Мобильная навигация"
        hidden={!open}
      >
        {[
          ...navigation,
          ["Как мы работаем", "/approach/"],
          ["Журнал", "/journal/"],
          ["Контакты", "/contacts/"],
        ].map(([label, to]) => (
          <Link to={to} key={to} onClick={() => setOpen(false)}>
            {label}
            <Arrow />
          </Link>
        ))}
        <a href={`tel:${company.tel}`}>{company.phone}</a>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand footer />
          <p>
            Генеральный подряд.
            <br />
            От проекта
            <br />
            до сдачи объекта.
          </p>
        </div>
        <div>
          <h2>Генподряд и состав работ</h2>
          {services.map((s) => (
            <Link key={s.slug} to={`/${s.slug}/`}>
              {s.title}
            </Link>
          ))}
        </div>
        <div>
          <h2>Компания</h2>
          {[
            ["О компании", "/about/"],
            ["Архитектурные концепции", "/projects/"],
            ["Как мы работаем", "/approach/"],
            ["Журнал", "/journal/"],
            ["Документы", "/documents/"],
          ].map(([label, to]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h2>Контакты</h2>
          <a className="footer-phone" href={`tel:${company.tel}`}>
            {company.phone}
          </a>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <address>{company.address}</address>
          <Link to="/contacts/" className="text-link">
            Связаться
            <Arrow />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} ТСК ФОРТ</span>
        <span>ИНН {company.inn}</span>
        <Link to="/privacy/">Конфиденциальность</Link>
        <span>От замысла к результату.</span>
      </div>
    </footer>
  );
}
function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Хлебные крошки" className="breadcrumbs">
      <Link to="/">Главная</Link>
      {items.map(([label, to], i) => (
        <span key={label}>
          <span aria-hidden="true">/</span>
          {to ? (
            <Link to={to}>{label}</Link>
          ) : (
            <span aria-current={i === items.length - 1 ? "page" : undefined}>
              {label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
function Heading({ label, title, text, link, dark = false }) {
  return (
    <div className={`section-heading ${dark ? "on-dark" : ""}`}>
      <div>
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      <div>
        {text && <p>{text}</p>}
        {link && (
          <Link to={link[1]} className="text-link">
            {link[0]}
            <Arrow />
          </Link>
        )}
      </div>
    </div>
  );
}
function ProjectCard({ item }) {
  return (
    <Link className="project-card" to={`/projects/${item.slug}/`}>
      <div className="project-image">
        <img
          src={asset(`models/${item.model}.jpg?v=engineering-20260906`)}
          alt={`Архитектурная концепция: ${item.title.toLowerCase()}`}
          width="1600"
          height="1200"
          loading="lazy"
        />
        <span className="project-badge">3D-концепция</span>
        <span className="project-open">
          <Arrow diagonal />
        </span>
      </div>
      <div className="project-card-copy">
        <span>{item.type}</span>
        <h3>{item.title}</h3>
        <p>{item.subtitle}</p>
      </div>
    </Link>
  );
}
function ArticleCard({ article }) {
  return (
    <Link className="article-card" to={`/journal/${article.slug}/`}>
      <div className="article-meta">
        <span>{article.category}</span>
        <span>{article.reading}</span>
      </div>
      <h3>{article.title}</h3>
      <span className="text-link">
        Читать материал
        <Arrow diagonal />
      </span>
    </Link>
  );
}
function CTA({
  title = "Обсудим ваш следующий объект",
  text = "Расскажите о задаче. Определим исходные данные, состав работ и следующий шаг.",
}) {
  return (
    <section className="cta-band">
      <div className="container cta-content">
        <div>
          <p className="eyebrow">Начнём с разговора</p>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <ButtonLink light />
      </div>
    </section>
  );
}
function FAQ({ questions }) {
  return questions.length ? (
    <section className="section container faq-section">
      <Heading label="Вопросы заказчиков" title="Уточним главное" />
      <div className="faq-list">
        {questions.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  ) : null;
}
function Workflow({ short = false }) {
  return (
    <ol className={`workflow ${short ? "workflow-short" : ""}`}>
      {process.map(([title, text], i) => (
        <li key={title}>
          <span className="step-number">{String(i + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  );
}
function ContractScope() {
  const scope = [
    [
      "01",
      "Подготовка и проектирование",
      "Исходные данные, проектные решения, объёмы и смета. Увязываем архитектуру, конструкции и инженерные системы.",
      "/design/",
    ],
    [
      "02",
      "Строительство",
      "Организация площадки, общестроительные и специальные работы. Координация подрядчиков, ресурсов и поставок.",
      "/construction/",
    ],
    [
      "03",
      "Сопровождение и контроль",
      "График, ПТО, контроль качества, согласование изменений и исполнительная документация на протяжении работ.",
      "/support/",
    ],
    [
      "04",
      "Передача результата",
      "Предъявление выполненных работ, закрытие замечаний и передача согласованного комплекта документов заказчику.",
      "/approach/",
    ],
  ];
  return (
    <ol className="contract-scope">
      {scope.map(([number, title, text, to]) => (
        <li key={number}>
          <span className="scope-index">{number}</span>
          <h3>
            <Link to={to}>{title}</Link>
          </h3>
          <p>{text}</p>
          <Link
            to={to}
            className="scope-more"
            aria-label={title + " — подробнее"}
          >
            <Arrow diagonal />
          </Link>
        </li>
      ))}
    </ol>
  );
}
function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              ТСК ФОРТ · Тюмень
            </p>
            <h1>
              Генеральный
              <br />
              подряд
            </h1>
            <p className="hero-thesis">
              От проекта
              <br />
              до сдачи объекта.
            </p>
            <p className="hero-lead">
              Проектируем, строим и сопровождаем объект как единый процесс.
              Организуем людей, работы и документы — от исходных данных до
              передачи результата.
            </p>
            <div className="hero-actions">
              <ButtonLink />
              <ButtonLink to="/general-contracting/" secondary>
                Что входит в генподряд
              </ButtonLink>
            </div>
            <div className="hero-tags">
              <span>Проектирование</span>
              <span>Строительство</span>
              <span>Сопровождение</span>
            </div>
          </div>
          <figure className="hero-visual">
            <img
              src={asset("assets/hero-construction-concept.jpg")}
              width="1536"
              height="1024"
              fetchPriority="high"
              alt="Иллюстрация: инженеры с проектными чертежами на строительной площадке"
            />
            <figcaption>
              <span>Организация полного цикла</span>
              <span>Визуальная концепция</span>
            </figcaption>
          </figure>
        </div>
        <div className="container hero-bottom">
          <span>Один генподрядчик. Согласованные этапы.</span>
          <Link to="/general-contracting/" className="text-link">
            Наш подход к генподряду
            <Arrow />
          </Link>
        </div>
      </section>
      <section className="section container" id="directions">
        <Heading
          label="Генеральный подряд"
          title={
            <>
              Весь процесс.
              <br />В одной системе.
            </>
          }
          text="Для заказчика это единая организация работ: от проектной подготовки до сдачи. Состав участия и границы ответственности закрепляем в договоре."
          link={["Подробнее о генподряде", "/general-contracting/"]}
        />
        <ContractScope />
        <div className="work-composition">
          <p className="eyebrow">В составе строительных работ</p>
          <div>
            {services
              .filter((s) =>
                [
                  "capital-repair",
                  "facades",
                  "roofing",
                  "engineering",
                ].includes(s.slug),
              )
              .map((s) => (
                <Link key={s.slug} to={"/" + s.slug + "/"}>
                  {s.title}
                  <Arrow diagonal />
                </Link>
              ))}
          </div>
        </div>
      </section>
      <section className="dark-section">
        <div className="container section">
          <Heading
            dark
            label="Управление объектом"
            title={
              <>
                Проект. Площадка.
                <br />
                Контроль.
              </>
            }
            text="Генподряд связывает решения проектировщиков, работу подрядчиков и требования заказчика. На каждом этапе — понятный объём, ответственный участник и контрольная точка."
            link={["Организация работ", "/approach/"]}
          />
          <div className="control-grid">
            {[
              [
                "До начала работ",
                "Уточняем исходные данные, состав проекта, бюджет и последовательность строительства.",
              ],
              [
                "На площадке",
                "Координируем подрядчиков и поставки, контролируем объёмы, сроки и качество.",
              ],
              [
                "При передаче",
                "Предъявляем результат, закрываем замечания и комплектуем исполнительную документацию.",
              ],
            ].map(([h, p]) => (
              <div className="control-item" key={h}>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container engineering-preview">
        <Heading
          label="Проектирование в составе генподряда"
          title={
            <>
              От проектного решения
              <br />к конструкции.
            </>
          }
          text="Архитектура, несущая система и инженерные решения рассматриваются вместе. Трёхмерная модель помогает читать их взаимосвязь."
          link={["Проектирование и 3D", "/design/"]}
        />
        <div className="project-grid">
          {concepts.map((c) => (
            <ProjectCard key={c.slug} item={c} />
          ))}
        </div>
        <p className="caption">
          Демонстрационные архитектурно-конструктивные модели. Не являются
          рабочей документацией или перечнем построенных ТСК ФОРТ объектов.
        </p>
      </section>
      <section className="section section-muted">
        <div className="container">
          <Heading
            label="Этапы взаимодействия"
            title="От задачи к выполненным работам"
          />
          <Workflow short />
        </div>
      </section>
      <CTA
        title="Обсудим ваш объект"
        text="Пришлите проект, техническое задание или описание задачи. Определим состав генподрядных работ и исходные данные для расчёта."
      />
    </>
  );
}
function ConceptSwitcher() {
  const [selected, setSelected] = useState("apartment");
  const item = concepts.find((c) => c.model === selected);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("model");
    if (concepts.some((c) => c.model === value)) setSelected(value);
  }, []);
  function select(value) {
    setSelected(value);
    const url = new URL(window.location.href);
    url.searchParams.set("model", value);
    window.history.replaceState({}, "", url);
  }
  return (
    <>
      <div className="concept-tabs" role="group" aria-label="Выбрать модель">
        {concepts.map((c) => (
          <button
            type="button"
            key={c.model}
            aria-pressed={selected === c.model}
            onClick={() => select(c.model)}
          >
            {c.type}
            <span>↗</span>
          </button>
        ))}
      </div>
      <ModelViewer key={selected} model={selected} />
      <div className="concept-description">
        <div>
          <span className="eyebrow">Архитектурная концепция</span>
          <h3>{item.title}</h3>
        </div>
        <p>{item.description}</p>
        <Link className="text-link" to={`/projects/${item.slug}/`}>
          Подробнее о концепции
          <Arrow />
        </Link>
      </div>
    </>
  );
}
function ServicePage({ service }) {
  const isDesign = service.slug === "design";
  const isGeneral = service.slug === "general-contracting";
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs
          items={
            isGeneral
              ? [[service.title]]
              : [
                  ["Генеральный подряд", "/general-contracting/"],
                  [service.title],
                ]
          }
        />
        <div className="page-hero-grid">
          <div>
            <p className="eyebrow">{service.label}</p>
            <h1>{service.title}</h1>
            <p className="page-lead">{service.lead}</p>
            <ButtonLink />
          </div>
          <div className="page-hero-aside">
            <p>{service.intro}</p>
            <span className="aside-rule" />
            <span className="eyebrow">ТСК ФОРТ / Тюмень</span>
            <p>
              Состав услуг, сроки и стоимость определяются под конкретный
              объект.
            </p>
          </div>
        </div>
      </section>
      {isGeneral ? (
        <section className="container general-scope" id="scope">
          <Heading
            label="Единая организация работ"
            title="Что входит в генподряд"
          />
          <ContractScope />
        </section>
      ) : isDesign ? (
        <section className="design-studio container">
          <div className="studio-heading">
            <div>
              <p className="eyebrow">Архитектура и конструкции</p>
              <h2>
                Чёткая геометрия.
                <br />
                Связанные решения.
              </h2>
            </div>
            <p>
              Рассмотрите перекрытия, колонны, лестничные узлы и фасадные
              элементы. Переключайте виды и состав модели.
            </p>
          </div>
          <ConceptSwitcher />
        </section>
      ) : (
        <section className="service-feature container">
          <img
            width="1600"
            height="1200"
            src={asset(`models/${service.model}.jpg?v=engineering-20260906`)}
            alt={`Архитектурно-конструктивная модель для направления «${service.title}»`}
          />
          <div className="service-feature-note">
            <span className="eyebrow">В центре внимания</span>
            <h2>
              {service.slug === "capital-repair"
                ? "Состояние здания. Точность решения."
                : "Результат складывается из деталей."}
            </h2>
            <p>{service.intro}</p>
            <span className="caption">Архитектурная иллюстрация</span>
          </div>
        </section>
      )}
      <section className="section container">
        <Heading label="Состав направления" title="Что входит в работу" />
        <div className="scope-grid">
          {service.tasks.map(([title, text]) => (
            <article key={title}>
              <span className="scope-mark" aria-hidden="true">
                ↗
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section result-section">
        <div className="container result-layout">
          <div>
            <p className="eyebrow">Результат для заказчика</p>
            <h2>
              Понятный объём.
              <br />
              Зафиксированный результат.
            </h2>
            <p>
              Содержание комплекта уточняется на старте и закрепляется в
              договоре.
            </p>
          </div>
          <ul className="result-list">
            {service.result.map((r) => (
              <li key={r}>
                <span aria-hidden="true">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section container">
        <Heading
          label="Последовательность"
          title="Как строится взаимодействие"
        />
        <Workflow short />
      </section>
      <FAQ questions={service.questions} />
      <section className="container related-services">
        <span className="eyebrow">Другие составляющие генподряда</span>
        <div>
          {services
            .filter(
              (s) =>
                ["construction", "design", "support"].includes(s.slug) &&
                s.slug !== service.slug,
            )
            .map((s) => (
              <Link key={s.slug} to={`/${s.slug}/`}>
                {s.title}
                <Arrow diagonal />
              </Link>
            ))}
        </div>
      </section>
      <CTA
        title={
          isDesign
            ? "Обсудим проект вашего здания"
            : "Расскажите о вашем объекте"
        }
      />
    </>
  );
}
function ProjectsPage() {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Проекты"]]} />
        <p className="eyebrow">Проектирование в составе генподряда</p>
        <h1>
          Архитектура
          <br />
          <em>и конструкции.</em>
        </h1>
        <p className="page-lead">
          Три типа зданий в инженерной аксонометрии. Перекрытия, колонны,
          лестничные узлы и фасады — в единой объёмной модели.
        </p>
      </section>
      <section className="container projects-catalog">
        <div className="filter-bar" role="group" aria-label="Тип объекта">
          {[
            ["Все концепции", "all"],
            ["Жильё", "apartment"],
            ["Образование", "school"],
            ["Медицина", "hospital"],
          ].map(([label, value]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="project-grid">
          {concepts
            .filter((c) => filter === "all" || filter === c.model)
            .map((c) => (
              <ProjectCard key={c.slug} item={c} />
            ))}
        </div>
        <p className="caption">
          Концептуальные модели иллюстрируют архитектурные решения и не являются
          перечнем построенных ТСК ФОРТ объектов.
        </p>
      </section>
      <section className="section container">
        <Heading
          label="Проектная подготовка"
          title="От исходных данных к проекту"
          text="Состав проектных решений определяется участком, заданием заказчика, исходными данными и согласованным объёмом документации."
          link={["О проектировании", "/design/"]}
        />
      </section>
      <CTA />
    </>
  );
}
function ProjectPage({ item }) {
  return (
    <>
      <section className="page-hero project-page-hero container">
        <Breadcrumbs items={[["Проекты", "/projects/"], [item.title]]} />
        <div className="project-heading">
          <div>
            <p className="eyebrow">{item.type} · Архитектурная концепция</p>
            <h1>{item.title}</h1>
          </div>
          <p>{item.subtitle}</p>
        </div>
      </section>
      <section className="container">
        <ModelViewer model={item.model} />
        <p className="caption">
          Демонстрационная архитектурно-конструктивная модель. Не является
          рабочим проектом или сведениями о выполненном объекте.
        </p>
      </section>
      <section className="section container project-story">
        <div>
          <p className="eyebrow">Идея проекта</p>
          <h2>{item.subtitle}</h2>
        </div>
        <div>
          <p className="page-lead">{item.description}</p>
          {item.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
      <section className="section-muted">
        <div className="container project-features">
          {item.features.map(([h, p]) => (
            <div key={h}>
              <p className="eyebrow">{h}</p>
              <h3>{p}</h3>
            </div>
          ))}
        </div>
      </section>
      <section className="section container">
        <Heading label="Продолжить просмотр" title="Другие концепции" />
        <div className="project-grid project-grid-two">
          {concepts
            .filter((c) => c.slug !== item.slug)
            .map((c) => (
              <ProjectCard key={c.slug} item={c} />
            ))}
        </div>
      </section>
      <CTA title="Каким будет ваш проект?" />
    </>
  );
}
function About() {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["О компании"]]} />
        <p className="eyebrow">ТСК ФОРТ</p>
        <h1>
          Строительство —<br />
          это ответственность
          <br />
          <em>за целое.</em>
        </h1>
        <p className="page-lead">
          ТСК ФОРТ — генподрядная строительная компания из Тюмени.
          Проектирование, строительство и сопровождение объекта объединены в
          один процесс с согласованными этапами и ответственностью.
        </p>
      </section>
      <section className="about-band">
        <div className="container about-band-inner">
          <div className="about-wordmark" aria-hidden="true">
            ФОРТ<span>Основа. Связь. Результат.</span>
          </div>
          <p>
            Организуем работу вокруг объекта: от исходных данных и объёмов до
            снабжения, производства и документации. Согласованность этих частей
            определяет качество результата.
          </p>
        </div>
      </section>
      <section className="section container">
        <Heading
          label="Профиль компании"
          title="Собираем задачи в единую систему"
        />
        <div className="about-columns">
          {[
            [
              "Строительство",
              "Планирование этапов, организация площадки, координация участников и комплектование исполнительной документации.",
            ],
            [
              "Сопровождение",
              "ПТО, контроль качества, согласование изменений и исполнительная документация в составе генподрядных работ.",
            ],
            [
              "Проектные решения",
              "Подготовка и координация документации, увязка архитектуры, конструкций и инженерии с условиями объекта.",
            ],
          ].map(([h, p]) => (
            <div key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="dark-section section">
        <div className="container">
          <Heading
            dark
            label="Принципы взаимодействия"
            title="Профессионализм виден в работе"
          />
          <div className="principles">
            {[
              [
                "Ясные договорённости",
                "Объём, сроки, стоимость и границы ответственности определяются до начала работ.",
              ],
              [
                "Последовательность",
                "Производство опирается на подготовленные решения, ресурсы и доступный фронт.",
              ],
              [
                "Прослеживаемость",
                "Изменения, согласования и контрольные точки фиксируются в документах.",
              ],
              [
                "Открытый диалог",
                "Вопросы, влияющие на результат, выносятся на обсуждение с заказчиком.",
              ],
            ].map(([h, p]) => (
              <div key={h}>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container about-contact">
        <div>
          <p className="eyebrow">Наша база</p>
          <h2>Тюмень</h2>
          <p>{company.address}</p>
        </div>
        <div>
          <p>
            Географию и формат участия в новом проекте обсуждаем индивидуально
            после знакомства с задачей.
          </p>
          <ButtonLink to="/documents/" secondary>
            Реквизиты компании
          </ButtonLink>
        </div>
      </section>
      <CTA />
    </>
  );
}
function Approach() {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Как мы работаем"]]} />
        <p className="eyebrow">Управление объектом</p>
        <h1>
          Все участники.
          <br />
          Один <em>план.</em>
        </h1>
        <p className="page-lead">
          Каждый следующий этап опирается на подготовленный предыдущий. Так
          решения переходят из задания в проект, а из проекта — на площадку.
        </p>
      </section>
      <section className="section container approach-workflow">
        <Workflow />
      </section>
      <section className="section-muted section">
        <div className="container">
          <Heading label="Контроль по существу" title="Что видит заказчик" />
          <div className="scope-grid">
            {[
              [
                "Сроки",
                "Плановые вехи, фактическое продвижение и причины отклонений.",
              ],
              [
                "Объёмы",
                "Выполненные работы, незавершённые участки и готовность к следующему этапу.",
              ],
              [
                "Ресурсы",
                "Обеспечение материалами, механизмы и последовательность поставок.",
              ],
              [
                "Решения",
                "Вопросы на согласование, влияние изменений и актуальная документация.",
              ],
              [
                "Качество",
                "Контрольные точки, замечания и результаты их устранения.",
              ],
              [
                "Документы",
                "Комплектность актов, схем и документов на применённые материалы.",
              ],
            ].map(([h, p]) => (
              <article key={h}>
                <h3>{h}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
function Documents() {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Документы"]]} />
        <p className="eyebrow">Открытая информация</p>
        <h1>
          Документы
          <br />и <em>реквизиты.</em>
        </h1>
        <p className="page-lead">
          Данные компании для делового общения и подготовки договора. Документы
          по конкретному объекту предоставляются в рамках обсуждения задачи.
        </p>
      </section>
      <section className="container documents-layout">
        <div className="company-card">
          <p className="eyebrow">Карточка компании</p>
          <h2>ТСК ФОРТ</h2>
          <dl>
            {[
              ["ИНН", company.inn],
              ["ОГРН", company.ogrn],
              ["Адрес", company.address],
              ["Телефон", company.phone],
              ["Почта", company.email],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <a
            className="button button-secondary"
            href={asset("documents/company-card.txt")}
            download
          >
            Скачать реквизиты
            <Arrow />
          </a>
        </div>
        <div className="document-notes">
          <h2>Для начала сотрудничества</h2>
          <p>
            По запросу подготовим комплект документов компании и обсудим
            требования заказчика к участникам работ. Состав подтверждений
            определяется предметом договора.
          </p>
          <h3>По конкретному объекту</h3>
          <ul className="plain-list">
            <li>Техническое задание и исходные материалы.</li>
            <li>Состав работ и границы ответственности.</li>
            <li>Календарный график и этапы приёмки.</li>
            <li>Состав проектной и исполнительной документации.</li>
          </ul>
          <a
            className="text-link"
            href={`mailto:${company.email}?subject=${encodeURIComponent("Запрос документов ТСК ФОРТ")}`}
          >
            Запросить документы
            <Arrow />
          </a>
        </div>
      </section>
      <section className="section container">
        <Heading
          label="Подготовка запроса"
          title="Что прислать вместе с задачей"
        />
        <div className="scope-grid">
          {[
            [
              "Проект или планы",
              "Имеющиеся чертежи, назначение здания, площади и основные характеристики.",
            ],
            [
              "Объёмы и состояние",
              "Ведомость объёмов или дефектов, фотографии и результаты обследований.",
            ],
            [
              "Условия производства",
              "Местоположение, желаемые сроки, доступ на объект и ограничения.",
            ],
          ].map(([h, p]) => (
            <article key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
function Contacts() {
  const [draft, setDraft] = useState(null);
  function prepare(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = `Здравствуйте!\n\nНаправление: ${data.get("service")}\nОбъект: ${data.get("object")}\nЗадача: ${data.get("task")}\n\nКонтактное лицо: ${data.get("name")}\nДля связи: ${data.get("contact")}`;
    setDraft(
      `mailto:${company.email}?subject=${encodeURIComponent("Обсуждение объекта — ТСК ФОРТ")}&body=${encodeURIComponent(body)}`,
    );
  }
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Контакты"]]} />
        <p className="eyebrow">Начнём знакомство</p>
        <h1>
          Большой результат
          <br />
          начинается с <em>разговора.</em>
        </h1>
      </section>
      <section className="container contact-layout">
        <div className="contact-information">
          <a className="contact-big" href={`tel:${company.tel}`}>
            {company.phone}
          </a>
          <a className="contact-email" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          <div className="address-block">
            <p className="eyebrow">Офис компании</p>
            <address>{company.address}</address>
            <a
              className="text-link"
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(company.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть на карте
              <Arrow diagonal />
            </a>
          </div>
          <div className="contact-tip">
            <h2>Уже есть проект?</h2>
            <p>
              Отправьте его на почту с кратким описанием задачи. Укажите объект,
              состав работ и желаемые сроки.
            </p>
            <Link className="text-link" to="/journal/brief/">
              Как подготовить запрос
              <Arrow />
            </Link>
          </div>
        </div>
        <form
          className="brief-form"
          onSubmit={prepare}
          onChange={() => {
            if (draft) setDraft(null);
          }}
        >
          <p className="eyebrow">Подготовить обращение</p>
          <h2>Расскажите о задаче</h2>
          <div className="form-grid">
            <label>
              Ваше имя
              <input
                name="name"
                autoComplete="name"
                required
                maxLength="120"
                placeholder="Как к вам обращаться…"
              />
            </label>
            <label>
              Телефон или почта
              <input
                name="contact"
                autoComplete="email"
                required
                maxLength="150"
                placeholder="Контакт для ответа…"
              />
            </label>
            <label className="full-width">
              Направление
              <select name="service" defaultValue="Генеральный подряд">
                {services.map((s) => (
                  <option key={s.slug}>{s.title}</option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Объект
              <input
                name="object"
                required
                maxLength="220"
                placeholder="Назначение и местоположение…"
              />
            </label>
            <label className="full-width">
              Что необходимо сделать
              <textarea
                name="task"
                rows="4"
                required
                maxLength="2000"
                placeholder="Состав работ, сроки, имеющиеся материалы…"
              />
            </label>
          </div>
          <p className="form-note">
            Подготовим текст письма. Вы сможете проверить его и приложить файлы
            в своей почтовой программе.
          </p>
          <button className="button" type="submit">
            Подготовить письмо
            <Arrow />
          </button>
          {draft && (
            <div className="draft-result" role="status">
              <p>
                Текст обращения подготовлен. Откройте письмо и отправьте его из
                своей почты.
              </p>
              <a className="button button-light" href={draft}>
                Открыть письмо
                <Arrow />
              </a>
            </div>
          )}
          <p className="form-privacy">
            Данные формы не отправляются автоматически.{" "}
            <Link to="/privacy/">Конфиденциальность</Link>
          </p>
        </form>
      </section>
      <section className="section container contact-links">
        <Link to="/documents/">
          Реквизиты компании
          <Arrow diagonal />
        </Link>
        <Link to="/approach/">
          Как строится работа
          <Arrow diagonal />
        </Link>
      </section>
    </>
  );
}
function Journal() {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Журнал"]]} />
        <p className="eyebrow">Практика строительства</p>
        <h1>
          Полезно знать
          <br />
          <em>до начала работ.</em>
        </h1>
        <p className="page-lead">
          Разбираем подготовку, проектирование и организацию ремонта. Материалы
          для заказчиков, которые хотят принимать обоснованные решения.
        </p>
      </section>
      <section className="container section-bottom">
        <div className="article-grid">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
function Article({ item }) {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Журнал", "/journal/"], [item.category]]} />
        <div className="article-meta">
          <span>{item.category}</span>
          <span>{item.reading}</span>
        </div>
        <h1 className="article-title">{item.title}</h1>
        <p className="page-lead">{item.lead}</p>
      </section>
      <div className="container article-layout">
        <aside>
          <p className="eyebrow">В этом материале</p>
          {item.sections.map(([h], i) => (
            <a key={h} href={`#part-${i}`}>
              {h}
            </a>
          ))}
          <ButtonLink to="/contacts/">Обсудить задачу</ButtonLink>
        </aside>
        <article className="article-body">
          {item.sections.map(([h, p], i) => (
            <section key={h} id={`part-${i}`}>
              <h2>{h}</h2>
              <p>{p}</p>
            </section>
          ))}
          <div className="article-takeaway">
            <h2>Начните с исходных данных</h2>
            <p>
              Направьте имеющиеся материалы в ТСК ФОРТ. Обсудим задачу и
              определим, что необходимо уточнить для следующего шага.
            </p>
            <Link className="text-link" to="/contacts/">
              Контакты компании
              <Arrow />
            </Link>
          </div>
        </article>
      </div>
      <section className="section container">
        <Heading label="Ещё по теме" title="Продолжить чтение" />
        <div className="article-grid">
          {articles
            .filter((a) => a.slug !== item.slug)
            .map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
        </div>
      </section>
    </>
  );
}
function Privacy() {
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[["Конфиденциальность"]]} />
        <h1>Конфиденциальность</h1>
        <p className="page-lead">
          Как работает этот сайт и подготовка обращений.
        </p>
      </section>
      <article className="container privacy-body section-bottom">
        <h2>Контактные данные компании</h2>
        <p>
          По вопросам работы сайта можно написать на {company.email} или
          связаться по телефону {company.phone}. Реквизиты доступны в разделе
          «Документы».
        </p>
        <h2>Форма подготовки письма</h2>
        <p>
          Введённые сведения используются в браузере для составления текста
          письма. Форма не отправляет данные на сервер и не сохраняет их в
          локальном хранилище. Отправка происходит только после вашего действия
          в почтовой программе.
        </p>
        <h2>Ссылки на внешние сервисы</h2>
        <p>
          При переходе к карте или в почтовую программу применяются условия
          выбранного сервиса. Само открытие этой страницы не загружает
          встроенную карту.
        </p>
        <h2>Техническая работа сайта</h2>
        <p>
          Сайт размещён на GitHub Pages. При загрузке страниц и файлов хостинг
          получает техническую информацию, необходимую для передачи содержимого,
          в соответствии со своими условиями. Сайт не подключает рекламные
          счётчики и не использует аналитические cookies.
        </p>
        <h2>Обращения</h2>
        <p>
          Не включайте в первоначальный запрос специальные категории
          персональных данных или сведения, не относящиеся к объекту. Состав
          документов для дальнейшей работы обсуждается индивидуально.
        </p>
      </article>
    </>
  );
}
function NotFound() {
  return (
    <section className="page-hero container section-bottom">
      <p className="eyebrow">404</p>
      <h1>Страница не найдена</h1>
      <p className="page-lead">
        Перейдите на главную или выберите направление работ в меню.
      </p>
      <ButtonLink to="/">На главную</ButtonLink>
    </section>
  );
}
function Content({ path }) {
  if (path === "/") return <Home />;
  const service = services.find((s) => path === `/${s.slug}/`);
  if (service) return <ServicePage service={service} />;
  const concept = concepts.find((c) => path === `/projects/${c.slug}/`);
  if (concept) return <ProjectPage item={concept} />;
  const article = articles.find((a) => path === `/journal/${a.slug}/`);
  if (article) return <Article item={article} />;
  const pages = {
    "/projects/": ProjectsPage,
    "/about/": About,
    "/approach/": Approach,
    "/documents/": Documents,
    "/contacts/": Contacts,
    "/journal/": Journal,
    "/privacy/": Privacy,
  };
  const Page = pages[path] || NotFound;
  return <Page />;
}
export default function Site({ initialPath }) {
  const [path, setPath] = useState(initialPath || currentPath);
  useEffect(() => {
    function navigate(e) {
      const a = e.target.closest("a");
      if (
        !a ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        a.target ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(a.href);
      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith(SITE_BASE) ||
        /\.[a-z]+$/i.test(url.pathname)
      )
        return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      history.pushState({}, "", url);
      setPath(currentPath());
      window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() =>
        document.getElementById("main-content")?.focus({ preventScroll: true }),
      );
    }
    function pop() {
      setPath(currentPath());
    }
    document.addEventListener("click", navigate);
    window.addEventListener("popstate", pop);
    return () => {
      document.removeEventListener("click", navigate);
      window.removeEventListener("popstate", pop);
    };
  }, []);
  useEffect(() => {
    const meta = pageMeta[path] || ["Страница не найдена — ТСК ФОРТ", ""];
    document.title = meta[0];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta[1]);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `${SITE_URL}${path.slice(1)}`);
  }, [path]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>
      <Header path={path} />
      <main id="main-content" key={path} tabIndex={-1}>
        <Content path={path} />
      </main>
      <Footer />
    </>
  );
}
