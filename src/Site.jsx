import { useState } from "react";
import {
  SITE_BASE,
  asset,
  href,
  company,
  navigation,
  services,
  projects,
  process,
} from "./siteData.js";

const Arrow = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
function Link({ to = "/", children, ...props }) {
  return (
    <a href={href(to)} {...props}>
      {children}
    </a>
  );
}
function Button({
  to = "/contacts/",
  children = "Связаться с нами",
  secondary = false,
}) {
  return (
    <Link to={to} className={"button" + (secondary ? " secondary" : "")}>
      {children}
      <Arrow />
    </Link>
  );
}
function Brand() {
  return (
    <Link className="brand" aria-label="ТСК ФОРТ — главная">
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
  return (
    <header className="header">
      <div className="container header-row">
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
        <a className="header-contact" href={"mailto:" + company.email}>
          {company.email}
          <Arrow />
        </a>
        <details className="mobile-menu">
          <summary aria-label="Меню сайта">
            Меню<span aria-hidden="true">+</span>
          </summary>
          <nav aria-label="Мобильная навигация">
            {navigation.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                aria-current={path === to ? "page" : undefined}
              >
                {label}
                <Arrow />
              </Link>
            ))}
            <a href={"tel:" + company.tel}>{company.phone}</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            Капитальный ремонт.
            <br />
            Генеральный подряд.
            <br />
            Тюмень.
          </p>
        </div>
        <div>
          <h2>Направления</h2>
          <Link to="/general-contracting/">Генеральный подряд</Link>
          {services.map((s) => (
            <Link key={s.slug} to={"/" + s.slug + "/"}>
              {s.title}
            </Link>
          ))}
        </div>
        <div>
          <h2>Компания</h2>
          {[
            ...navigation.filter((x) => x[1] !== "/general-contracting/"),
            ["Порядок работы", "/approach/"],
            ["Реквизиты и документы", "/documents/"],
          ].map(([t, h]) => (
            <Link to={h} key={h}>
              {t}
            </Link>
          ))}
        </div>
        <div className="footer-contacts">
          <h2>Для связи</h2>
          <a href={"tel:" + company.tel}>{company.phone}</a>
          <a href={"mailto:" + company.email}>{company.email}</a>
          <address>{company.address}</address>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© ТСК ФОРТ · 2026</span>
        <span>ИНН {company.inn}</span>
        <Link to="/privacy/">Информация о данных</Link>
      </div>
    </footer>
  );
}
function PageHead({ label, title, text }) {
  return (
    <section className="container page-head">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link>Главная</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label}</span>
      </nav>
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {text && <p className="page-lead">{text}</p>}
    </section>
  );
}
function SectionHead({ label, title, text, link }) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      <div>
        {text && <p>{text}</p>}
        {link && (
          <Link className="text-link" to={link[1]}>
            {link[0]}
            <Arrow />
          </Link>
        )}
      </div>
    </div>
  );
}
function CTA() {
  return (
    <section className="contact-band">
      <div className="container contact-band-inner">
        <div>
          <p className="eyebrow">Заказчикам и партнёрам</p>
          <h2>
            Обсудим задачу
            <br />
            по вашему объекту.
          </h2>
        </div>
        <div>
          <p>
            Для знакомства с компанией, уточнения опыта или состава работ —
            свяжитесь с нами.
          </p>
          <a className="contact-mail" href={"mailto:" + company.email}>
            {company.email}
            <Arrow />
          </a>
          <a className="text-link" href={"tel:" + company.tel}>
            {company.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
function ServiceRows() {
  return (
    <div className="service-rows">
      {services.map((s) => (
        <Link className="service-row" to={"/" + s.slug + "/"} key={s.slug}>
          <h3>{s.title}</h3>
          <p>{s.lead}</p>
          <Arrow />
        </Link>
      ))}
    </div>
  );
}
function ProjectCard({ p }) {
  return (
    <Link to={"/projects/" + p.slug + "/"} className="project-card">
      {p.image ? (
        <div className="project-image">
          <img
            src={asset(p.image)}
            alt={p.alt}
            width={p.width || 1200}
            height={p.height || 800}
            loading="lazy"
          />
          <span>{p.category}</span>
        </div>
      ) : (
        <div className="project-placeholder">
          <span>Тюмень</span>
          <strong>{p.title}</strong>
          <span>{p.category}</span>
        </div>
      )}
      <div className="project-info">
        <div>
          <p className="eyebrow">{p.location}</p>
          <h3>{p.title}</h3>
          <p>{p.scope}</p>
        </div>
        <Arrow />
      </div>
    </Link>
  );
}
function ProjectGrid({ limit }) {
  return (
    <div className="project-grid">
      {(limit ? projects.slice(0, limit) : projects).map((p) => (
        <ProjectCard p={p} key={p.slug} />
      ))}
    </div>
  );
}
function Workflow() {
  return (
    <ol className="workflow">
      {process.map(([title, text], i) => (
        <li key={title}>
          <span className="step">{String(i + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  );
}
function Home() {
  const featured = projects.find((p) => p.image);
  return (
    <>
      <section className="container home-hero">
        <div className="hero-heading">
          <p className="eyebrow">Строительная компания · Тюмень</p>
          <h1>
            Генеральный подряд.
            <br />
            <span>Капитальный ремонт.</span>
          </h1>
        </div>
        <div className="hero-bottom">
          <p>
            Работаем с существующими зданиями.
            <br />
            Обследуем и проектируем, организуем ремонт,
            <br className="desktop-break" /> сопровождаем работы документацией.
          </p>
          <div className="actions">
            <Button to="/projects/">Объекты и опыт</Button>
            <Button to="/about/" secondary>
              О компании
            </Button>
          </div>
        </div>
        {featured && (
          <figure className="hero-photo">
            <img
              src={asset(featured.image)}
              alt={featured.alt}
              width={featured.width || 1200}
              height={featured.height || 800}
              fetchPriority="high"
            />
            <figcaption>
              <span>
                {featured.title} · {featured.location}
              </span>
              <span>Фотография из материалов обследования</span>
            </figcaption>
          </figure>
        )}
      </section>
      <section className="section container">
        <SectionHead
          label="Наша работа"
          title={
            <>
              Существующие здания.
              <br />
              Конкретные задачи.
            </>
          }
          text="Основное внимание — капитальному ремонту многоквартирных домов: кровлям, фасадам и технической подготовке работ."
        />
        <ServiceRows />
      </section>
      <section className="section surface">
        <div className="container">
          <SectionHead
            label="Объекты и опыт"
            title="За каждым адресом — работа."
            text="Показываем объекты и конкретный состав участия компании. Обследование и проектирование выделены отдельно от строительных работ."
            link={["Смотреть объекты", "/projects/"]}
          />
          <ProjectGrid limit={4} />
        </div>
      </section>
      <section className="section container">
        <SectionHead
          label="Генеральный подряд"
          title={
            <>
              Организация работ.
              <br />
              От задачи до результата.
            </>
          }
          text="Подготовка, производство и документация — части одного процесса. Состав участия и ответственность определяем для каждого объекта."
          link={["Наш подход", "/general-contracting/"]}
        />
        <Workflow />
      </section>
      <CTA />
    </>
  );
}
function General() {
  return (
    <>
      <PageHead
        label="Направления"
        title="Генеральный подряд"
        text="Объединяем подготовку, производство и сопровождение работ. В центре — капитальный ремонт существующих зданий."
      />
      <section className="container section compact">
        <div className="intro-grid">
          <h2>
            Один объект.
            <br />
            Согласованная работа.
          </h2>
          <div>
            <p>
              Генеральный подряд — это организация всего согласованного объёма:
              от разбора исходных данных до предъявления результата заказчику.
            </p>
            <p>
              Для каждого объекта определяем состав работ, участников,
              последовательность и порядок передачи документов. Обследование,
              проектирование, ремонт и ПТО могут входить в единый комплекс либо
              выполняться по отдельному заданию.
            </p>
          </div>
        </div>
        <ServiceRows />
      </section>
      <section className="surface section">
        <div className="container">
          <SectionHead
            label="Порядок работы"
            title="Понятные этапы"
            text="Границы ответственности, сроки и состав результата закрепляются в договоре."
          />
          <Workflow />
        </div>
      </section>
      <CTA />
    </>
  );
}
function Service({ s }) {
  return (
    <>
      <PageHead label={s.label} title={s.title} text={s.lead} />
      <section className="container section compact">
        <div className="intro-grid">
          <h2>Состав работы</h2>
          <p className="large-copy">{s.intro}</p>
        </div>
        <div className="detail-grid">
          {s.tasks.map(([t, d]) => (
            <article key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Состав и объём участия определяются заданием и договором по
          конкретному объекту.
        </p>
      </section>
      <section className="surface section">
        <div className="container">
          <SectionHead
            label="Практика компании"
            title="Объекты и материалы"
            link={["Все объекты", "/projects/"]}
          />
          <ProjectGrid limit={2} />
        </div>
      </section>
      <CTA />
    </>
  );
}
function Projects() {
  return (
    <>
      <PageHead
        label="Объекты и опыт"
        title={
          <>
            Опыт в конкретных
            <br />
            объектах.
          </>
        }
        text="Многоквартирные дома в Тюмени. Обследование и проектирование капитального ремонта крыш и фасадов."
      />
      <section className="container section compact">
        <ProjectGrid />
        <p className="note">
          Карточки отражают указанный в материалах состав участия. Подготовка
          проекта или обследования не означает завершение строительно-монтажных
          работ.
        </p>
      </section>
      <CTA />
    </>
  );
}
function Project({ p }) {
  return (
    <>
      <PageHead label="Объекты и опыт" title={p.title} text={p.summary} />
      <section className="container section compact">
        {p.image && (
          <figure className="case-photo">
            <img
              src={asset(p.image)}
              alt={p.alt}
              width={p.width || 1200}
              height={p.height || 800}
              style={{ maxWidth: p.width || 1200 }}
            />
            <figcaption>
              Фотография из материалов технического обследования. Не является
              фотографией результата капитального ремонта.
            </figcaption>
          </figure>
        )}
        <div className="case-grid">
          <dl className="facts">
            <div>
              <dt>Местоположение</dt>
              <dd>{p.location}</dd>
            </div>
            <div>
              <dt>Объект</dt>
              <dd>Многоквартирный жилой дом</dd>
            </div>
            <div>
              <dt>Направление</dt>
              <dd>{p.category}</dd>
            </div>
            <div>
              <dt>Состав участия</dt>
              <dd>{p.scope}</dd>
            </div>
          </dl>
          <div>
            <p className="eyebrow">Работа по объекту</p>
            <h2>
              {p.heading || "От состояния здания — к решениям по ремонту."}
            </h2>
            <p>{p.description}</p>
            <ul className="plain-list">
              {p.details?.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="note">{p.evidenceNote}</p>
          </div>
        </div>
        <Link className="text-link" to="/projects/">
          Все объекты
          <Arrow />
        </Link>
      </section>
      <CTA />
    </>
  );
}
function About() {
  return (
    <>
      <PageHead
        label="О компании"
        title={
          <>
            ТСК ФОРТ.
            <br />
            Строительная компания.
          </>
        }
        text="Тюмень. Капитальный ремонт существующих зданий, генеральный подряд и техническое сопровождение работ."
      />
      <section className="section compact container">
        <div className="intro-grid">
          <h2>
            Знаем работу
            <br />с существующим зданием.
          </h2>
          <div>
            <p className="large-copy">
              В центре нашей деятельности — многоквартирные дома, их кровли и
              фасады. Работа начинается с состояния конкретного объекта и
              продолжается в проекте, на площадке и в документах.
            </p>
            <p>
              Сочетаем производственные задачи с обследованием, проектной
              подготовкой и ПТО. Для заказчика это возможность связать
              технические решения и организацию работ в едином процессе.
            </p>
            <Link className="text-link" to="/documents/">
              Реквизиты и документы
              <Arrow />
            </Link>
          </div>
        </div>
        <div className="principles">
          {[
            [
              "Предметный подход",
              "Отталкиваемся от состояния здания, исходных материалов и задачи заказчика.",
            ],
            [
              "Определённый состав",
              "Согласуем объёмы и ответственность до начала работ.",
            ],
            [
              "Связь с документами",
              "Сопоставляем проектные решения, фактические объёмы и исполнительные материалы.",
            ],
          ].map(([t, d]) => (
            <article key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="surface section">
        <div className="container">
          <SectionHead
            label="Практика"
            title="Наш опыт — в объектах"
            link={["Объекты и состав участия", "/projects/"]}
          />
          <ProjectGrid limit={2} />
        </div>
      </section>
      <CTA />
    </>
  );
}
function Approach() {
  return (
    <>
      <PageHead
        label="Порядок работы"
        title={
          <>
            От исходных данных
            <br />
            до передачи результата.
          </>
        }
        text="Последовательность, которая связывает технические решения, производство и документацию."
      />
      <section className="section compact container">
        <Workflow />
        <div className="intro-grid with-top-rule">
          <h2>Что важно на старте</h2>
          <div>
            <ul className="plain-list">
              <li>Адрес, назначение и состояние объекта.</li>
              <li>
                Проект, обмеры, ведомость дефектов и имеющиеся фотографии.
              </li>
              <li>Предполагаемый состав работ и условия доступа.</li>
              <li>Требования к срокам, согласованиям и передаче документов.</li>
            </ul>
            <p>
              Если часть материалов отсутствует, сначала уточняем, какие данные
              потребуются. Сроки и стоимость определяются после разбора задачи.
            </p>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
function CompanyDetails() {
  return (
    <dl className="facts">
      <div>
        <dt>Компания</dt>
        <dd>ТСК ФОРТ</dd>
      </div>
      <div>
        <dt>ИНН</dt>
        <dd>{company.inn}</dd>
      </div>
      <div>
        <dt>ОГРН</dt>
        <dd>{company.ogrn}</dd>
      </div>
      <div>
        <dt>Адрес офиса</dt>
        <dd>{company.address}</dd>
      </div>
      <div>
        <dt>Электронная почта</dt>
        <dd>
          <a href={"mailto:" + company.email}>{company.email}</a>
        </dd>
      </div>
    </dl>
  );
}
function Documents() {
  return (
    <>
      <PageHead
        label="Реквизиты и документы"
        title={
          <>
            Информация
            <br />
            для сотрудничества.
          </>
        }
        text="Основные сведения о компании. Документы для проверки контрагента и конкретного объекта — по запросу."
      />
      <section className="section compact container intro-grid">
        <CompanyDetails />
        <div>
          <h2>Запросить документы</h2>
          <p>
            Напишите, для какой задачи нужны документы: знакомство с компанией,
            рассмотрение участия в работах или согласование договора.
          </p>
          <p>
            Состав предоставляемого комплекта и актуальность сведений уточняются
            при обращении. В открытом доступе не публикуем подписи, банковские
            сведения и внутренние материалы по объектам.
          </p>
          <a
            className="button"
            href={
              "mailto:" +
              company.email +
              "?subject=" +
              encodeURIComponent("Запрос документов ТСК ФОРТ")
            }
          >
            Запросить по почте
            <Arrow />
          </a>
        </div>
      </section>
    </>
  );
}
function Contacts() {
  const [copyStatus, setCopyStatus] = useState("");
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(company.email);
      setCopyStatus("Адрес скопирован");
    } catch {
      setCopyStatus(
        "Не удалось скопировать. Выделите адрес почты выше и скопируйте его вручную.",
      );
    }
  }
  return (
    <>
      <PageHead
        label="Контакты"
        title="Будем на связи."
        text="Для знакомства с компанией, обсуждения объекта и взаимодействия по текущим работам."
      />
      <section className="container contact-layout section compact">
        <div>
          <p className="eyebrow">ТСК ФОРТ</p>
          <a className="big-contact" href={"tel:" + company.tel}>
            {company.phone}
          </a>
          <a className="big-contact" href={"mailto:" + company.email}>
            {company.email}
          </a>
          <button
            className="text-link copy-email"
            type="button"
            onClick={copyEmail}
          >
            Скопировать почту
            <Arrow />
          </button>
          <span className="copy-status" role="status">
            {copyStatus}
          </span>
          <address>{company.address}</address>
          <a
            className="text-link"
            href={
              "https://yandex.ru/maps/?text=" +
              encodeURIComponent(company.address)
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Посмотреть на карте
            <Arrow />
          </a>
        </div>
        <div className="contact-brief">
          <p className="eyebrow">Для предметного разговора</p>
          <h2>
            Расскажите
            <br />о задаче
          </h2>
          <p>
            Укажите адрес объекта, состав необходимых работ и желаемые сроки.
            Если есть проект, ведомость объёмов или фотографии — приложите их к
            письму.
          </p>
          <a
            className="button"
            href={
              "mailto:" +
              company.email +
              "?subject=" +
              encodeURIComponent("Обращение в ТСК ФОРТ")
            }
          >
            Открыть письмо
            <Arrow />
          </a>
          <p className="note">
            Ссылка откроет вашу почтовую программу. Письмо отправляется вами;
            сайт не отправляет заявки автоматически.
          </p>
        </div>
      </section>
    </>
  );
}
function Privacy() {
  return (
    <>
      <PageHead label="Информация о данных" title="Связь через сайт" />
      <section className="container section compact prose">
        <h2>Обращение по электронной почте</h2>
        <p>
          На сайте нет формы сбора заявок. Ссылки с адресом электронной почты
          открывают вашу почтовую программу. Вы самостоятельно выбираете
          содержание письма, вложения и отправляете их на адрес компании.
        </p>
        <h2>Данные в браузере</h2>
        <p>
          Сайт не устанавливает собственные аналитические cookie и не сохраняет
          данные обращения в локальное хранилище. Кнопка копирования помещает
          только адрес электронной почты компании в буфер обмена после нажатия.
        </p>
        <h2>Внешние сервисы</h2>
        <p>
          При переходе к карте или использовании почтовой программы применяются
          правила соответствующего сервиса. Хостинг может обрабатывать
          технические сведения о запросах в рамках своей работы.
        </p>
        <p>
          Вопросы по обращению можно направить на{" "}
          <a href={"mailto:" + company.email}>{company.email}</a>.
        </p>
      </section>
    </>
  );
}
function Content({ path }) {
  if (path === "/") return <Home />;
  if (path === "/general-contracting/") return <General />;
  const service = services.find((s) => path === "/" + s.slug + "/");
  if (service) return <Service s={service} />;
  const project = projects.find((p) => path === "/projects/" + p.slug + "/");
  if (project) return <Project p={project} />;
  const pages = {
    "/projects/": Projects,
    "/about/": About,
    "/approach/": Approach,
    "/documents/": Documents,
    "/contacts/": Contacts,
    "/privacy/": Privacy,
  };
  const Page = pages[path];
  return Page ? (
    <Page />
  ) : (
    <>
      <PageHead
        label="404"
        title="Страница не найдена"
        text="Возможно, адрес изменился. Перейдите к актуальной информации о компании."
      />
      <section className="container section compact">
        <Button to="/">На главную</Button>
      </section>
    </>
  );
}
function getPath() {
  if (typeof window === "undefined") return "/";
  let path = window.location.pathname;
  if (path.startsWith(SITE_BASE)) path = "/" + path.slice(SITE_BASE.length);
  path = path.replace(/index\.html$/, "");
  return path.endsWith("/") ? path : path + "/";
}
export default function Site({ initialPath }) {
  const path = initialPath || getPath();
  return (
    <>
      <a className="skip-link" href="#main-content">
        К содержанию
      </a>
      <Header path={path} />
      <main id="main-content" tabIndex="-1">
        <Content path={path} />
      </main>
      <Footer />
    </>
  );
}
