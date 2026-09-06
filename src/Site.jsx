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
      <div className="header-top container">
        <span>Строительная компания · Тюмень</span>
        <div>
          <Link to="/documents/">Документы и реквизиты</Link>
          <a href={`mailto:${company.email}`}>{company.email}</a>
        </div>
      </div>
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
            Капитальный ремонт.
            <br />
            Проектирование.
          </p>
        </div>
        <div>
          <h2>Направления</h2>
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
          src={asset(`models/${item.model}.jpg`)}
          alt={`Архитектурная концепция: ${item.title.toLowerCase()}`}
          width="1400"
          height="1100"
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
function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              Генподряд и проектирование
            </p>
            <h1>
              Строим на
              <br />
              <em>точных</em>
              <br />
              решениях.
            </h1>
            <p className="hero-lead">
              От проектной идеи до строительной площадки. Организуем
              строительство и капитальный ремонт с понятной ответственностью за
              каждый этап.
            </p>
            <div className="hero-actions">
              <ButtonLink />
              <Link to="/design/" className="text-link">
                Проектирование
                <Arrow diagonal />
              </Link>
            </div>
          </div>
          <div className="hero-model">
            <div className="model-topline">
              <span>Архитектура в деталях</span>
              <span>Жилая среда / 3D</span>
            </div>
            <ModelViewer model="apartment" compact />
            <div className="hero-model-footer">
              <span>Жилой квартал</span>
              <Link to="/projects/residential/">
                Исследовать концепцию
                <Arrow diagonal />
              </Link>
            </div>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>Проектируем. Организуем. Строим.</span>
          <div>
            <span>Жилые здания</span>
            <span>Общественные объекты</span>
            <span>Инженерная инфраструктура</span>
          </div>
          <a href="#directions" aria-label="К направлениям работы">
            ↓
          </a>
        </div>
      </section>
      <section className="section container" id="directions">
        <Heading
          label="Направления работы"
          title={
            <>
              Одна задача.
              <br />
              Связанные решения.
            </>
          }
          text="Проект, производство и инженерия работают на общий результат. Выберите комплекс услуг, который нужен вашему объекту."
          link={["Наш подход", "/approach/"]}
        />
        <div className="service-grid">
          {services.slice(0, 3).map((s, i) => (
            <Link
              className={`service-card service-card-${i}`}
              to={`/${s.slug}/`}
              key={s.slug}
            >
              <div className="service-graphic" aria-hidden="true">
                <svg viewBox="0 0 220 145">
                  <path
                    d={
                      i === 0
                        ? "M30 125V40l55-26 110 34v77H30Zm55-111v111m-55-85 110 36 55-28M140 76v49M44 53v14m16-9v14m39-23v13m17-7v13m43 0v14m17-18v14M44 83v14m16-9v14m39-23v13m17-7v13m43 0v14m17-18v14"
                        : i === 1
                          ? "M35 125V28h120v97H35Zm120-72h32v72h-32M50 43h26v28H50V43Zm45 0h44v28H95V43ZM50 89h26v36m19 0V89h44v36M15 127h195M20 21h145"
                          : "m110 12 88 48-88 51-88-51 88-48ZM22 80l88 50 88-50M22 99l88 43 88-43M66 36l88 49m0-49L66 85M110 12v99"
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </div>
              <span className="eyebrow">{s.label}</span>
              <h3>{s.title}</h3>
              <p>{s.lead}</p>
              <span className="service-card-link">
                Подробнее
                <Arrow diagonal />
              </span>
            </Link>
          ))}
        </div>
        <div className="secondary-services">
          {services.slice(3).map((s) => (
            <Link key={s.slug} to={`/${s.slug}/`}>
              {s.title}
              <Arrow diagonal />
            </Link>
          ))}
        </div>
      </section>
      <section className="dark-section">
        <div className="container section">
          <Heading
            dark
            label="Организация строительства"
            title={
              <>
                Сложный объект.
                <br />
                Понятное управление.
              </>
            }
            text="Управляем связями между проектом, людьми, материалами и сроками. Заказчик видит состояние объекта и решения, которые необходимо принять."
            link={["Как мы работаем", "/approach/"]}
          />
          <div className="control-grid">
            {[
              [
                "Проект и объёмы",
                "Определяем состав задачи, проверяем комплектность исходных данных и согласуем границы работ.",
              ],
              [
                "График и производство",
                "Планируем последовательность, ресурсы и поставки под реальный фронт работ.",
              ],
              [
                "Качество и документы",
                "Фиксируем контрольные точки, скрытые работы и комплект документов к передаче.",
              ],
            ].map(([h, p], i) => (
              <div className="control-item" key={h}>
                <span className="control-symbol" aria-hidden="true">
                  {["⌑", "↗", "✓"][i]}
                </span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <Heading
          label="Архитектурная коллекция"
          title="Рассмотрите идею со всех сторон"
          text="Три оригинальные концепции зданий. Вращайте объём, приближайте фасады и переключайтесь в конструктивный режим."
          link={["Все 3D-концепции", "/projects/"]}
        />
        <div className="project-grid">
          {concepts.map((c) => (
            <ProjectCard key={c.slug} item={c} />
          ))}
        </div>
        <p className="caption">
          Представленные макеты — архитектурные концепции, созданные для
          демонстрации пространственных решений.
        </p>
      </section>
      <section className="section section-muted">
        <div className="container">
          <Heading
            label="Путь к результату"
            title="От первого разговора до передачи работ"
          />
          <Workflow short />
        </div>
      </section>
      <section className="section container">
        <Heading
          label="Журнал ТСК ФОРТ"
          title="Понимать стройку — управлять результатом"
          link={["Все материалы", "/journal/"]}
        />
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
  return (
    <>
      <section className="page-hero container">
        <Breadcrumbs items={[[service.title]]} />
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
      {isDesign ? (
        <section className="design-studio container">
          <div className="studio-heading">
            <div>
              <p className="eyebrow">Интерактивная архитектура</p>
              <h2>
                Проект начинается
                <br />с объёмного видения
              </h2>
            </div>
            <p>
              Исследуйте наши демонстрационные модели: пропорции здания,
              фасадные решения и организацию территории.
            </p>
          </div>
          <ConceptSwitcher />
        </section>
      ) : (
        <section className="service-feature container">
          <img
            width="1400"
            height="1100"
            src={asset(`models/${service.model}.jpg`)}
            alt={`Архитектурный макет для направления «${service.title}»`}
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
        <span className="eyebrow">Связанные направления</span>
        <div>
          {services
            .filter((s) => s.slug !== service.slug)
            .slice(0, 3)
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
        <p className="eyebrow">Архитектура и пространственные решения</p>
        <h1>
          Идеи, которые
          <br />
          <em>обретают объём.</em>
        </h1>
        <p className="page-lead">
          Коллекция интерактивных архитектурных концепций. Жильё, образование и
          медицина — три разных задачи, три подробных макета.
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
          label="Реальная задача — индивидуальное решение"
          title="От концепции к вашему объекту"
          text="Визуальная идея становится проектом после уточнения участка, требований заказчика, исходных данных и состава документации."
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
          Оригинальный демонстрационный макет. Не является рабочим проектом или
          сведениями о выполненном объекте.
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
          ТСК ФОРТ — строительная компания из Тюмени. Генеральный подряд,
          капитальный ремонт и проектирование составляют основу нашей работы.
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
              "Строительство и генподряд",
              "Планирование этапов, организация площадки, координация участников и комплектование исполнительной документации.",
            ],
            [
              "Капитальный ремонт",
              "Фасады и кровли многоквартирных домов, инженерные системы и комплексные работы на существующих зданиях.",
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
      requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
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
