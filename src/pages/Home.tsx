import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Home.css";
import imgNetflix from "../assets/logoN.jpg";
import imgPrime from "../assets/primevideo.jpg";
import imgVix from "../assets/logoVix.jpg";
import imgParamount from "../assets/logoParamount.jpg";
import imgDisney from "../assets/disney.jpg";
import imgMax from "../assets/max.jpg";
import imgViki from "../assets/viki.jpg";
import imgPlex from "../assets/plex.jpg";
import imgCrunchyroll from "../assets/logoCrunchyroll.jpg";
import imgCanva from "../assets/canva.jpg";
import imgChatgpt from "../assets/chatgpt.jpg";
import imgIptv from "../assets/iptv.jpg";
import imgYoutube from "../assets/logoYT.jpg";
import imgAppleTv from "../assets/appletv.jpg";
import imgCar1 from "../assets/car1.jpg";
import imgCar2 from "../assets/car3nen.jpg";
import imgCar3 from "../assets/car3.jpg";
import imgOleadaTV from "../assets/oleada-tv-logo.png";

const carouselBanners = [
  { src: imgCar1, alt: "Banner 1" },
  { src: imgCar2, alt: "Banner 2" },
  { src: imgCar3, alt: "Banner 3" },
];

const platforms = [
  { id: 1, image: imgNetflix, name: "Netflix" },
  { id: 2, image: imgPrime, name: "Prime Video" },
  { id: 3, image: imgVix, name: "Vix" },
  { id: 4, image: imgParamount, name: "Paramount+" },
  { id: 5, image: imgDisney, name: "Disney+" },
  { id: 6, image: imgMax, name: "Max" },
  { id: 7, image: imgOleadaTV, name: "Oleada Tv" },
  { id: 8, image: imgViki, name: "Viki" },
  { id: 9, image: imgPlex, name: "Plex" },
  { id: 10, image: imgCrunchyroll, name: "Crunchyroll" },
  { id: 11, image: imgAppleTv, name: "Apple TV" },
  { id: 12, image: imgCanva, name: "Canva" },
  { id: 13, image: imgChatgpt, name: "ChatGPT" },
  { id: 14, image: imgIptv, name: "IPTV" },
  { id: 15, image: imgYoutube, name: "YouTube" },
];

function Home() {
  const { t } = useTranslation();
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % carouselBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevBanner = () =>
    setBannerIndex(
      (prev) => (prev - 1 + carouselBanners.length) % carouselBanners.length,
    );
  const nextBanner = () =>
    setBannerIndex((prev) => (prev + 1) % carouselBanners.length);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visiblePlatforms = isMobile ? platforms.slice(0, 12) : platforms;

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-top">
          <div className="home-left">
            <h1 className="home-title">{t("home.panelTitle")}</h1>
            <div className="home-description">
              <p>{t("home.description1")}</p>
              <p className="warning-text">{t("home.warning")}</p>
            </div>
            <div className="home-section">
              <h2>{t("home.howItWorks")}</h2>
              <ul>
                <li>{t("home.step1")}</li>
                <li>{t("home.step2")}</li>
                <li>{t("home.step3")}</li>
                <li>{t("home.step4")}</li>
                <li>{t("home.step5")}</li>
              </ul>
            </div>
          </div>

          <div className="home-right">
            <div className="home-contact">
              <h2>{t("home.contact")}</h2>
              <p>{t("home.supportText")}</p>
              <div className="contact-info">
                <div>
                  <strong>Email:</strong> bosterion2018@gmail.com
                </div>
                <div>
                  <strong>WhatsApp:</strong> +57 3024824806
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hm-banner">
        <button className="hm-arrow hm-arrow-left" onClick={prevBanner}>
          &#8249;
        </button>

        <div className="hm-banner-track">
          {carouselBanners.map((item, i) => (
            <img
              key={i}
              src={item.src}
              alt={item.alt}
              className={`hm-banner-img ${i === bannerIndex ? "active" : ""}`}
            />
          ))}
        </div>

        <button className="hm-arrow hm-arrow-right" onClick={nextBanner}>
          &#8250;
        </button>

        <div className="hm-dots">
          {carouselBanners.map((_, i) => (
            <span
              key={i}
              className={`hm-dot ${i === bannerIndex ? "active" : ""}`}
              onClick={() => setBannerIndex(i)}
            />
          ))}
        </div>
      </div>

      <div className="hm-section-title">
        <hr className="hm-line" />
        <h4>{t("home.chooseService")}</h4>
        <hr className="hm-line" />
      </div>

      <div className="hm-platforms">
        {visiblePlatforms.map((p) => (
          <div key={p.id} className="hm-platform-card">
            <img src={p.image} alt={p.name} />
            <div className="hm-platform-overlay">
              <span>{p.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hm-devices">
        <h3>{t("home.devicesTitle")}</h3>
        <div className="hm-devices-row">
          <div className="hm-device">
            <svg
              className="hm-device-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <p>{t("home.devices.pc")}</p>
          </div>
          <div className="hm-divider" />
          <div className="hm-device">
            <svg
              className="hm-device-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" />
            </svg>
            <p>{t("home.devices.mobileTablet")}</p>
          </div>
          <div className="hm-divider" />
          <div className="hm-device">
            <svg
              className="hm-device-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 12h12M6 8h4M14 8h4" />
              <rect x="2" y="6" width="20" height="12" rx="2" />
            </svg>
            <p>{t("home.devices.consoles")}</p>
          </div>
          <div className="hm-divider" />
          <div className="hm-device">
            <svg
              className="hm-device-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M8 20h8M12 18v2" />
            </svg>
            <p>{t("home.devices.tv")}</p>
          </div>
        </div>
      </div>

      <div className="hm-contact-section">
        <h3>{t("home.contactSectionTitle")}</h3>
        <div className="hm-contact-row">
          <div className="hm-contact-card">
            <i className="bi bi-whatsapp hm-contact-icon" />
            <h4>{t("home.supportCard.title")}</h4>
            <p>{t("home.supportCard.description")}</p>
            <a
              href="https://wa.me/573024824806"
              className="hm-contact-btn hm-btn-support"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.851L0 24l6.335-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.015-1.381l-.36-.214-3.733.888.924-3.63-.235-.374A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
              </svg>
              <span>{t("home.supportCard.button")}</span>
              <span className="hm-badge">{t("home.online")}</span>
            </a>
          </div>

          <div className="hm-contact-card">
            <i className="bi bi-whatsapp hm-contact-icon" />
            <h4>{t("home.topupCard.title")}</h4>
            <p>{t("home.topupCard.description")}</p>
            <a
              href="https://wa.me/573249847760"
              className="hm-contact-btn hm-btn-sales"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.851L0 24l6.335-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.015-1.381l-.36-.214-3.733.888.924-3.63-.235-.374A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
              </svg>
              <span>{t("home.topupCard.button")}</span>
              <span className="hm-badge">{t("home.online")}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
