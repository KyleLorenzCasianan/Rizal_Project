import { useEffect, useMemo, useState } from 'react'
import {
  geoGraticule,
  geoMercator,
  geoNaturalEarth1,
  geoPath,
} from 'd3-geo'
import { feature } from 'topojson-client'
import land110m from 'world-atlas/land-110m.json'
import philippinesGeoJson from './assets/philippines-50m.geo.json'
import './App.css'

const WORLD_WIDTH = 1000
const WORLD_HEIGHT = 500
const PH_WIDTH = 700
const PH_HEIGHT = 900
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.2

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const mapTabs = [
  {
    key: 'world',
    label: 'World Map',
    title: 'Jose Rizal Across the World',
    subtitle: 'Follow his studies, activism, writing, and exile beyond the Philippines.',
    points: [
      {
        id: 'calamba',
        name: 'Calamba, Laguna',
        years: '1861-1872',
        wikiPage: 'Calamba,_Laguna',
        lon: 121.165,
        lat: 14.211,
        what: 'Rizal was born here and developed his early love for learning, nature, and reform ideas from family influence.',
        during: 'Calamba in Rizal\'s youth reflected the social tensions of the late Spanish colonial period, where friar estates controlled land and many Filipino families faced economic pressure. The events surrounding the Cavite Mutiny in 1872 and the execution of Gomburza deeply influenced the reform-minded generation to which Rizal belonged. In this environment, education became a path for social mobility but also a space where racial discrimination was normalized. Rizal\'s early observations of injustice in his hometown later resurfaced in his novels, especially in his critiques of abusive authority. Calamba was not only his birthplace but also one of the earliest sources of his political consciousness.',
      },
      {
        id: 'singapore',
        name: 'Singapore',
        years: '1882 (en route)',
        wikiPage: 'Singapore',
        lon: 103.8198,
        lat: 1.3521,
        what: 'Rizal passed through Singapore on his first voyage to Europe, observing a major trading port shaped by global commerce.',
        during: 'Singapore in the 1880s was a thriving British colonial port where Asian, European, and Middle Eastern communities interacted through trade and labor. Its rapid growth showed how infrastructure, shipping routes, and legal institutions could transform an urban center into a regional hub. For Rizal, this stop offered a practical contrast to the slower and more restrictive economic systems in the Spanish Philippines. He saw firsthand how cosmopolitan environments encouraged mobility, multilingual exchange, and modern administration. The experience broadened his comparative view of governance in Asia under different colonial powers.',
      },
      {
        id: 'barcelona',
        name: 'Barcelona, Spain',
        years: '1882',
        wikiPage: 'Barcelona',
        lon: 2.1734,
        lat: 41.3851,
        what: 'He arrived in Spain and began writing for reform publications, including pieces advocating civil liberties for Filipinos.',
        during: 'Barcelona exposed Rizal to a politically vibrant press culture where debates on liberalism, republicanism, and regional identity were highly visible. Spain itself was politically unstable, with frequent shifts in power that shaped how colonial policy was discussed and defended. In this climate, Filipino reformists could frame their demands using the language of constitutional rights and civic participation. Rizal\'s early journalistic work benefited from this intellectual space, helping him sharpen both argument and audience awareness. The city became an entry point to European political discourse that would influence his later writings.',
      },
      {
        id: 'madrid',
        name: 'Madrid, Spain',
        years: '1882-1885',
        wikiPage: 'Madrid',
        lon: -3.7038,
        lat: 40.4168,
        what: 'He studied medicine and philosophy at Universidad Central and joined reform circles that shaped his political thought.',
        during: 'Madrid was the center of imperial politics, making it a strategic location for Filipino students seeking reforms from within the Spanish system. During Rizal\'s stay, the Propaganda Movement expanded through newspapers, associations, and public debate among expatriate intellectuals. Reformists argued for representation in the Cortes, equal legal status, and secularization, while conservative forces resisted colonial change. Rizal\'s academic training and political networking progressed side by side, giving him both professional credentials and ideological direction. Madrid therefore served as a laboratory where his reformist ideals became more coherent and public-facing.',
      },
      {
        id: 'paris',
        name: 'Paris, France',
        years: '1885-1886',
        wikiPage: 'Paris',
        lon: 2.3522,
        lat: 48.8566,
        what: 'Rizal trained under leading ophthalmologists and expanded his multilingual and scientific interests.',
        during: 'Paris in the late nineteenth century was one of Europe\'s leading centers for medicine, publishing, and modern political thought. Rizal\'s exposure to advanced clinical practice there strengthened his technical competence in ophthalmology and reinforced his respect for scientific rigor. At the same time, the city\'s intellectual culture encouraged comparative thinking about nationhood, citizenship, and social reform. He encountered artists, scholars, and professionals whose work reflected the confidence of industrial and scientific modernity. Paris helped him imagine how education and critical inquiry could serve national development.',
      },
      {
        id: 'heidelberg',
        name: 'Heidelberg, Germany',
        years: '1886',
        wikiPage: 'Heidelberg',
        lon: 8.6724,
        lat: 49.3988,
        what: 'He refined his medical specialization and completed key sections of Noli Me Tangere while abroad.',
        during: 'Heidelberg represented the disciplined university culture of Germany, where methodical research and scholarly precision were highly valued. Rizal\'s medical training here deepened his professional identity while he simultaneously advanced his literary and political project. The intellectual atmosphere encouraged careful documentation, historical inquiry, and strong evidentiary argument, qualities visible in his prose. As he worked on Noli Me Tangere, he translated lived colonial realities into a form understandable to international readers. Heidelberg thus strengthened both his technical expertise and the analytic sharpness of his reformist voice.',
      },
      {
        id: 'berlin',
        name: 'Berlin, Germany',
        years: '1886-1887',
        wikiPage: 'Berlin',
        lon: 13.405,
        lat: 52.52,
        what: 'Rizal worked to secure publication support for Noli Me Tangere and built links with scholars interested in Philippine history.',
        during: 'Berlin gave Rizal access to printers, academic circles, and comparative historical scholarship that were crucial to his publishing goals. The city was a symbol of modern state power, industrial development, and intellectual specialization in late nineteenth-century Europe. Against this backdrop, conditions in the Philippines appeared even more starkly unequal and underdeveloped. Rizal\'s interactions with scholars and institutions in Berlin helped internationalize interest in Filipino history and identity. His work there demonstrated how literary production could function as both political critique and nation-building effort.',
      },
      {
        id: 'london',
        name: 'London, United Kingdom',
        years: '1888-1889',
        wikiPage: 'London',
        lon: -0.1276,
        lat: 51.5072,
        what: 'He researched at the British Museum and annotated Antonio de Morga to recover a pre-colonial Filipino historical perspective.',
        during: 'London during the Victorian era was the center of a global empire and a major archive of colonial knowledge. At the British Museum, Rizal used historical documents to challenge narratives that portrayed Filipinos as passive or uncivilized before Spanish rule. His annotation of Morga was a deliberate intellectual intervention to restore agency and complexity to Philippine history. The city\'s imperial institutions showed him both the power and the politics of archival authority. London sharpened his belief that controlling historical narrative was essential to any national awakening.',
      },
      {
        id: 'brussels',
        name: 'Brussels, Belgium',
        years: '1890',
        wikiPage: 'Brussels',
        lon: 4.3517,
        lat: 50.8503,
        what: 'Rizal continued writing El Filibusterismo in Brussels while managing financial constraints and political pressure.',
        during: 'Brussels offered Rizal a comparatively quieter environment where he could continue writing despite financial and emotional strain. Across Europe, socialist, liberal, and nationalist debates were intensifying, with questions of power and social justice becoming harder to ignore. These continental tensions resonated with his growing frustration over the limits of purely gradual reform in the Philippines. While in Brussels, his tone in El Filibusterismo became darker and more critical, reflecting sharper political urgency. The city became a transitional space between early optimism and a more sobering critique of colonial reality.',
      },
      {
        id: 'hong-kong',
        name: 'Hong Kong',
        years: '1891-1892',
        wikiPage: 'Hong_Kong',
        lon: 114.1694,
        lat: 22.3193,
        what: 'He practiced medicine, assisted fellow Filipinos, and continued writing and organizing reformist support.',
        during: 'Hong Kong functioned as a practical refuge where Rizal could work, write, and organize with less direct pressure from Spanish colonial authorities. Its legal and commercial environment enabled wider communication among expatriates, reformists, and families under surveillance. Rizal\'s medical practice there connected him to Filipino migrants and elites, expanding his support network beyond student circles. The city also highlighted the strategic value of diaspora communities in sustaining political movements. Hong Kong became both a safe operational base and a node in the transnational reform effort.',
      },
      {
        id: 'yokohama',
        name: 'Yokohama, Japan',
        years: '1888',
        wikiPage: 'Yokohama',
        lon: 139.638,
        lat: 35.4437,
        what: 'Rizal stayed in Yokohama and admired Japan\'s modernization, discipline, and strong national identity.',
        during: 'Yokohama introduced Rizal to Meiji Japan at a time of rapid modernization in education, military organization, technology, and public administration. He observed that an Asian nation could adapt modern systems while preserving cultural dignity and political sovereignty. This contrasted strongly with the colonial dependency imposed on the Philippines. Japan\'s progress offered Rizal a concrete example that reform was not exclusively a Western path but could be locally led and culturally grounded. The experience reinforced his confidence that Filipino society could also modernize through education and civic reform.',
      },
    ],
  },
  {
    key: 'philippines',
    label: 'Philippines Map',
    title: 'Jose Rizal in the Philippines',
    subtitle: 'Key places in his homeland where his life and legacy took decisive turns.',
    points: [
      {
        id: 'manila',
        name: 'Manila',
        years: '1872-1882, 1892',
        wikiPage: 'Manila',
        lon: 120.9842,
        lat: 14.5995,
        what: 'He studied at Ateneo and UST, and later founded La Liga Filipina to pursue peaceful reforms.',
        during: 'Manila was the political and ecclesiastical center of colonial rule, where privilege and exclusion were visible in schools, courts, and public life. Rizal\'s formative years there exposed him to both high academic achievement and structural discrimination against indios and mestizos. In 1892, his founding of La Liga Filipina in Manila represented an organized attempt at peaceful civic reform and mutual aid. Colonial authorities quickly viewed such initiatives as threatening, reflecting the narrow limits of tolerated dissent. Manila was therefore both the site of intellectual development and the arena where reform met direct repression.',
      },
      {
        id: 'binan',
        name: 'Biñan, Laguna',
        years: 'Early schooling',
        wikiPage: 'Binan',
        lon: 121.0819,
        lat: 14.3334,
        what: 'Rizal studied in Biñan under Maestro Justiniano Aquino Cruz, sharpening his academic discipline at an early age.',
        during: 'Biñan was one of the early settings where Rizal experienced formal instruction beyond the family household. Local schooling in the period often combined strict discipline with social hierarchy, revealing how class and race influenced treatment and opportunity. These early encounters helped shape his sensitivity to dignity, merit, and fairness in educational life. The contrast between talent and structural inequality remained a recurring theme in his later social critiques. Biñan thus served as a formative stage in his moral and intellectual development.',
      },
      {
        id: 'dapitan',
        name: 'Dapitan, Zamboanga',
        years: '1892-1896',
        wikiPage: 'Dapitan',
        lon: 123.4244,
        lat: 8.6549,
        what: 'During exile, Rizal built a school, practiced medicine, designed civic projects, and served the community.',
        during: 'Dapitan transformed Rizal from primarily a writer-reformer into a hands-on community builder under conditions of political exile. He organized a small school, introduced practical science learning, practiced medicine, and helped design local infrastructure and sanitation improvements. These projects demonstrated his belief that nation-building required everyday civic work, not only political slogans. Even while monitored by colonial authorities, he showed that constructive leadership could thrive in constrained settings. Dapitan remains one of the strongest examples of Rizal\'s applied reform philosophy.',
      },
      {
        id: 'cebu',
        name: 'Cebu (transit)',
        years: '1892',
        wikiPage: 'Cebu_City',
        lon: 123.8854,
        lat: 10.3157,
        what: 'Rizal passed through the Visayas en route to exile, a reminder that his fate was being decided by colonial authorities.',
        during: 'Cebu represented the inter-island routes through which colonial power managed movement, communication, and punishment across the archipelago. Rizal\'s transit through the Visayas highlighted how political decisions made in Manila affected distant provincial spaces. Ports like Cebu were not only economic gateways but also logistical instruments of state control. The journey underscored the geographic scale of colonial governance and surveillance. It also showed how reformist figures became symbols recognized far beyond the capital.',
      },
      {
        id: 'fort-santiago',
        name: 'Fort Santiago',
        years: '1896',
        wikiPage: 'Fort_Santiago',
        lon: 120.9712,
        lat: 14.5975,
        what: 'He was imprisoned here before trial, writing final letters and preparing for his final sacrifice.',
        during: 'Fort Santiago was one of the most feared colonial detention sites, associated with interrogation, confinement, and exemplary punishment. Rizal\'s imprisonment there occurred as revolutionary unrest intensified, increasing the political stakes of his trial. Authorities aimed to frame him as a warning to reformists and revolutionaries alike, regardless of his complex position on armed revolt. In this setting, his writings and final communications took on profound moral and historical significance. Fort Santiago became a symbolic threshold between colonial prosecution and national memory.',
      },
      {
        id: 'bagumbayan',
        name: 'Bagumbayan (Luneta)',
        years: 'December 30, 1896',
        wikiPage: 'Rizal_Park',
        lon: 120.9822,
        lat: 14.5827,
        what: 'Rizal was executed here, inspiring generations in the struggle for national freedom and identity.',
        during: 'Bagumbayan became the site where colonial authority intended to end Rizal\'s influence through public execution. Instead, the event amplified his symbolic power and helped unify diverse sectors of the nationalist movement. His death was interpreted not as defeat but as testimony to principle, sacrifice, and civic responsibility. During the revolution, this symbolism strengthened morale and gave moral clarity to anti-colonial struggle. The location remains central to Philippine historical memory because it marks the conversion of a reformist intellectual into a national martyr.',
      },
      {
        id: 'calamba-ph',
        name: 'Calamba, Laguna',
        years: 'Childhood and Returns',
        wikiPage: 'Calamba,_Laguna',
        lon: 121.165,
        lat: 14.211,
        what: 'His hometown remained central to his social awareness, especially on agrarian injustice and colonial abuse.',
        during: 'Rizal\'s return to Calamba connected personal loyalty to concrete social conflict, especially disputes over land rent and friar estate control. The agrarian tensions there revealed how legal and economic systems protected powerful institutions over ordinary tenants. As his family and neighbors experienced harassment and displacement, reform became an urgent lived issue rather than an abstract principle. These events deepened his critique of colonial governance and sharpened his call for structural change. Calamba therefore remained both an emotional home and a decisive political reference point in his life.',
      },
    ],
  },
]

function App() {
  const [activeTab, setActiveTab] = useState('world')
  const [isLocationFocusOpen, setIsLocationFocusOpen] = useState(false)
  const [isAboutPageOpen, setIsAboutPageOpen] = useState(false)
  const [focusBackgrounds, setFocusBackgrounds] = useState({})
  const [zoomByMap, setZoomByMap] = useState({
    world: { scale: 1, x: 0, y: 0 },
    philippines: { scale: 1, x: 0, y: 0 },
  })
  const [isDraggingMap, setIsDraggingMap] = useState(false)
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 })
  const activeMap = useMemo(
    () => mapTabs.find((tab) => tab.key === activeTab) ?? mapTabs[0],
    [activeTab],
  )

  const [activePointId, setActivePointId] = useState(mapTabs[0].points[0].id)

  useEffect(() => {
    setActivePointId(activeMap.points[0].id)
    setIsLocationFocusOpen(false)
    setIsAboutPageOpen(false)
  }, [activeMap])

  const activePoint =
    activeMap.points.find((point) => point.id === activePointId) ??
    activeMap.points[0]

  const widerContextParagraphs = useMemo(() => {
    const parts = activePoint.during.match(/[^.!?]+[.!?]*/g) ?? []
    const cleaned = parts.map((sentence) => sentence.trim()).filter(Boolean)
    const grouped = []

    for (let index = 0; index < cleaned.length; index += 2) {
      grouped.push(cleaned.slice(index, index + 2).join(' '))
    }

    return grouped
  }, [activePoint])

  useEffect(() => {
    if (!isLocationFocusOpen || !activePoint?.wikiPage) {
      return
    }

    if (focusBackgrounds[activePoint.id]) {
      return
    }

    let isCancelled = false
    const pageTitle = encodeURIComponent(activePoint.wikiPage)

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`)
      .then((response) => response.json())
      .then((data) => {
        if (isCancelled) {
          return
        }

        const imageUrl = data?.originalimage?.source || data?.thumbnail?.source
        if (imageUrl) {
          setFocusBackgrounds((prev) => ({
            ...prev,
            [activePoint.id]: imageUrl,
          }))
        }
      })
      .catch(() => {
        // Fail silently and keep gradient fallback.
      })

    return () => {
      isCancelled = true
    }
  }, [activePoint, isLocationFocusOpen, focusBackgrounds])

  const worldLand = useMemo(
    () => feature(land110m, land110m.objects.land),
    [],
  )

  const philippinesGeo = useMemo(
    () => philippinesGeoJson,
    [],
  )

  const worldProjection = useMemo(() => {
    const projection = geoNaturalEarth1()
    projection.fitSize([WORLD_WIDTH, WORLD_HEIGHT], worldLand)
    return projection
  }, [worldLand])

  const philippinesProjection = useMemo(() => {
    const projection = geoMercator()
    if (philippinesGeo) {
      projection.fitExtent(
        [
          [80, 60],
          [PH_WIDTH - 80, PH_HEIGHT - 60],
        ],
        philippinesGeo,
      )
    }
    return projection
  }, [philippinesGeo])

  const getPinPosition = (point) => {
    const isWorld = activeMap.key === 'world'
    const projection = isWorld ? worldProjection : philippinesProjection
    const [x = 0, y = 0] = projection([point.lon, point.lat]) ?? []
    const width = isWorld ? WORLD_WIDTH : PH_WIDTH
    const height = isWorld ? WORLD_HEIGHT : PH_HEIGHT

    return {
      left: `${Math.min(Math.max((x / width) * 100, 2), 98)}%`,
      top: `${Math.min(Math.max((y / height) * 100, 2), 98)}%`,
    }
  }

  const updateActiveMapZoom = (updater) => {
    setZoomByMap((prev) => ({
      ...prev,
      [activeMap.key]: updater(prev[activeMap.key]),
    }))
  }

  const isMapControlInteraction = (target) =>
    target instanceof Element && Boolean(target.closest('.map-controls'))

  const handleMapWheel = (event) => {
    if (isMapControlInteraction(event.target)) {
      return
    }

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top

    updateActiveMapZoom((current) => {
      const scaleFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      const newScale = clamp(current.scale * scaleFactor, MIN_ZOOM, MAX_ZOOM)

      if (newScale === current.scale) {
        return current
      }

      const newX = pointerX - ((pointerX - current.x) * newScale) / current.scale
      const newY = pointerY - ((pointerY - current.y) * newScale) / current.scale

      return { scale: newScale, x: newX, y: newY }
    })
  }

  const handlePointerDown = (event) => {
    if (isMapControlInteraction(event.target)) {
      return
    }

    if (event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDraggingMap(true)
    setLastPointer({ x: event.clientX, y: event.clientY })
  }

  const handlePointerMove = (event) => {
    if (!isDraggingMap) {
      return
    }

    const deltaX = event.clientX - lastPointer.x
    const deltaY = event.clientY - lastPointer.y

    setLastPointer({ x: event.clientX, y: event.clientY })
    updateActiveMapZoom((current) => ({
      ...current,
      x: current.x + deltaX,
      y: current.y + deltaY,
    }))
  }

  const stopDraggingMap = () => {
    setIsDraggingMap(false)
  }

  const zoomIn = () => {
    updateActiveMapZoom((current) => ({
      ...current,
      scale: clamp(current.scale * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }))
  }

  const zoomOut = () => {
    updateActiveMapZoom((current) => ({
      ...current,
      scale: clamp(current.scale / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }))
  }

  const resetZoom = () => {
    updateActiveMapZoom(() => ({ scale: 1, x: 0, y: 0 }))
  }

  return (
    <main className="rizal-app">
      <header className="hero-panel">
        <p className="eyebrow">Interactive Learning Experience</p>
        <h1>Jose Rizal Travel Atlas</h1>
      </header>

      {isAboutPageOpen ? (
        <section className="about-page" aria-label="About this page">
          <button
            className="back-button"
            onClick={() => setIsAboutPageOpen(false)}
          >
            Back to Map
          </button>
          <h2>About this page</h2>
          <p>
            This page is an interactive learning atlas about Jose Rizal. It helps
            you explore the places he lived in, traveled to, studied in, and wrote
            from, while showing what happened in those locations and why they
            mattered in Philippine history.
          </p>
          <p>
            Use the World Map and Philippines Map tabs to compare local and global
            contexts, click map markers for location-specific summaries, and open
            View Details for deeper narrative content.
          </p>
        </section>
      ) : isLocationFocusOpen ? (
        <section className="location-focus" aria-label="Focused location details">
          <div
            className="focus-background"
            style={{
              backgroundImage: focusBackgrounds[activePoint.id]
                ? `url(${focusBackgrounds[activePoint.id]})`
                : undefined,
            }}
            aria-hidden="true"
          ></div>

          <div className="focus-content">
            <button
              className="back-button"
              onClick={() => setIsLocationFocusOpen(false)}
            >
              Back to Map
            </button>

            <p className="detail-label">Focused Rizal Location</p>
            <h2>{activePoint.name}</h2>
            <p className="year-chip">{activePoint.years}</p>
            <p className="focus-copy">
              {activePoint.what} In this location, Rizal's decisions and intellectual
              work helped shape his role as a reformist thinker and national figure.
            </p>
            <p className="focus-copy focus-label">
              <strong>Wider context:</strong>
            </p>
            <div className="focus-context-stack">
              {widerContextParagraphs.map((paragraph, index) => (
                <p key={`${activePoint.id}-during-${index}`} className="focus-context-line">
                  {paragraph}
                </p>
              ))}
              <p className="focus-context-line">
                Together, these local and global developments show how Rizal's life
                was tied to larger political, educational, and social transformations
                in the late 19th century.
              </p>
            </div>

            <div className="focus-context">
              <p>
                This location is part of the <strong>{activeMap.label}</strong> journey.
                Use the back button to continue exploring other Rizal locations.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="tab-shell" aria-label="Map selector">
          <div className="tab-bar" role="tablist" aria-label="Choose map view">
            {mapTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="map-grid">
            <article className={`map-board ${activeTab}`}>
              <div className="map-title-wrap">
                <h2>{activeMap.title}</h2>
                <p>{activeMap.subtitle}</p>
              </div>

              <div
                className={`map-canvas ${activeMap.key} ${isDraggingMap ? 'dragging' : ''}`}
                aria-label={`${activeMap.label} with Rizal locations`}
                onWheel={handleMapWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDraggingMap}
                onPointerCancel={stopDraggingMap}
              >
                <div
                  className="map-zoom-layer"
                  style={{
                    transform: `translate(${zoomByMap[activeMap.key].x}px, ${zoomByMap[activeMap.key].y}px) scale(${zoomByMap[activeMap.key].scale})`,
                  }}
                >
                  {activeMap.key === 'world' ? (
                    <WorldMapSvg worldLand={worldLand} projection={worldProjection} />
                  ) : (
                    <PhilippinesMapSvg
                      philippinesGeo={philippinesGeo}
                      projection={philippinesProjection}
                    />
                  )}

                  {activeMap.points.map((point) => (
                    <button
                      key={point.id}
                      className={`pin ${activePoint.id === point.id ? 'selected' : ''}`}
                      style={{
                        ...getPinPosition(point),
                        '--label-x': `${point.labelDx ?? 0}px`,
                        '--label-y': `${point.labelDy ?? 0}px`,
                      }}
                      onClick={() => setActivePointId(point.id)}
                      aria-label={`View ${point.name}`}
                    />
                  ))}
                </div>

                <div
                  className="map-controls"
                  role="group"
                  aria-label="Map zoom controls"
                  onPointerDown={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  <button type="button" onClick={zoomIn} aria-label="Zoom in">
                    +
                  </button>
                  <button type="button" onClick={zoomOut} aria-label="Zoom out">
                    -
                  </button>
                  <button type="button" onClick={resetZoom} aria-label="Reset zoom">
                    Reset
                  </button>
                </div>
              </div>
            </article>

            <div className="side-column">
              <div className="side-top-actions">
                <button
                  className="focus-button"
                  onClick={() => {
                    setIsAboutPageOpen(true)
                    setIsLocationFocusOpen(false)
                  }}
                >
                  About this page
                </button>
                <button
                  className="focus-button"
                  onClick={() => {
                    setIsLocationFocusOpen(true)
                    setIsAboutPageOpen(false)
                  }}
                >
                  View Details
                </button>
              </div>

              <aside className="details-panel">
                <div className="details-header-row">
                  <p className="detail-label">Selected Location</p>
                </div>
                <h3>{activePoint.name}</h3>
                <p className="year-chip">{activePoint.years}</p>
                <p>{activePoint.what}</p>

                <div className="trail-scroll">
                  <h4>Rizal Trail</h4>
                  <ul className="trail-list">
                    {activeMap.points.map((point) => (
                      <li key={`${activeMap.key}-${point.id}`}>
                        <button
                          className={`trail-item ${activePoint.id === point.id ? 'current' : ''}`}
                          onClick={() => setActivePointId(point.id)}
                        >
                          <strong>{point.name}</strong>
                          <span>{point.years}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <section className="footer-note">
        <p>
          Tip: Click map pins or items in the Rizal Trail to switch stories and
          compare his impact by region.
        </p>
      </section>
    </main>
  )
}

function WorldMapSvg({ worldLand, projection }) {
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const graticulePath = useMemo(() => {
    const graticule = geoGraticule().step([20, 20])
    return pathGen(graticule())
  }, [pathGen])

  return (
    <svg
      className="map-svg"
      viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
      role="presentation"
      aria-hidden="true"
    >
      <rect className="map-ocean" x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} />
      <path className="graticule-path" d={graticulePath} />
      <path className="world-land" d={pathGen(worldLand) ?? ''} />
    </svg>
  )
}

function PhilippinesMapSvg({ philippinesGeo, projection }) {
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const graticulePath = useMemo(() => {
    const graticule = geoGraticule()
      .extent([
        [116, 4],
        [127, 22],
      ])
      .step([1, 1])
    return pathGen(graticule())
  }, [pathGen])

  return (
    <svg
      className="map-svg"
      viewBox={`0 0 ${PH_WIDTH} ${PH_HEIGHT}`}
      role="presentation"
      aria-hidden="true"
    >
      <rect className="map-ocean" x="0" y="0" width={PH_WIDTH} height={PH_HEIGHT} />
      <path className="graticule-path" d={graticulePath} />
      {philippinesGeo ? (
        <path className="ph-country" d={pathGen(philippinesGeo) ?? ''} />
      ) : null}
    </svg>
  )
}

export default App
