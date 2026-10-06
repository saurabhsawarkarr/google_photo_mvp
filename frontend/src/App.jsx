import { useState, useEffect, useRef } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, X, Loader2, ListFilter, CloudOff, Plus, Bell, User, Sparkles, Image as ImageIcon, MapPin, Calendar, Activity, Eye, Package, Users, ArrowLeft, SlidersHorizontal, Check } from 'lucide-react'
import { search, refineSession, removeClue } from './services/api'

// Fallback dimension definitions when session suggestions aren't available
const FALLBACK_DIMENSIONS = [
  { key: 'person', label: 'Who' },
  { key: 'location', label: 'Where' },
  { key: 'time', label: 'When' },
  { key: 'activity', label: 'What happened' },
  { key: 'visual', label: 'What it looked like' },
  { key: 'object', label: 'Objects' }
];

const DETAIL_DIMENSIONS = [
  { key: 'activity', label: 'What happened' },
  { key: 'location', label: 'Where' },
  { key: 'person', label: 'Who' },
  { key: 'object', label: 'Objects' }
];

function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  
  const [activeDimension, setActiveDimension] = useState(null)
  const [refineInput, setRefineInput] = useState('')
  const [disambiguation, setDisambiguation] = useState(null)
  const [zeroResultWarning, setZeroResultWarning] = useState(null)
  const [stagedClues, setStagedClues] = useState([])
  const searchInputRef = useRef(null)

  const toggleStagedClue = (text, dimension) => {
    setStagedClues(prev => {
      const idx = prev.findIndex(c => c.text === text && c.dimension === dimension)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, { text, dimension }]
    })
  }

  const isStaged = (text, dimension) => {
    return stagedClues.some(c => c.text === text && c.dimension === dimension)
  }
  
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isRefineScreenOpen, setIsRefineScreenOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('photos')
  const [allPhotos, setAllPhotos] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const fixUrls = (res) => {
    if (res?.results?.photos) {
      res.results.photos = res.results.photos.map(p => ({
        ...p,
        url: import.meta.env.BASE_URL + (p.url.startsWith('/') ? p.url.slice(1) : p.url)
      }));
    }
    return res;
  }

  // Fetch all photos initially
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        let res = await search('')
        res = fixUrls(res)
        setSession(res)
        setAllPhotos(res.results?.photos || [])
      } catch (err) {
        console.error("Failed to load initial photos:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const activeClues = session?.understanding?.clues?.filter(c => c.active) || []
  const hasActiveSearch = activeClues.length > 0

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      let res;
      if (hasActiveSearch) {
        res = await refineSession(session.session_id, query)
        if (res.disambiguation_required) {
          setDisambiguation({ alternatives: res.alternatives, text: query })
          setLoading(false)
          return
        }
        if (res.zero_results) {
          setZeroResultWarning(`Adding '${res.rejected_clue.value}' removed all results. Kept previous search.`)
          setTimeout(() => setZeroResultWarning(null), 4000)
        } else {
          setZeroResultWarning(null)
        }
      } else {
        res = await search(query)
      }
      res = fixUrls(res)
      setSession(res)
      setActiveDimension(null)
      setIsRefineScreenOpen(false)
      setQuery('')
      setStagedClues([])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleRemoveClue = async (clueId) => {
    setLoading(true)
    try {
      let res = await removeClue(session.session_id, clueId)
      res = fixUrls(res)
      setSession(res)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleRefine = async (e, clueToRefine, dimHint) => {
    if (e) e.preventDefault()
    if (!clueToRefine && !refineInput.trim()) return
    setLoading(true)
    try {
      const res = await refineSession(
        session.session_id, 
        clueToRefine || refineInput, 
        dimHint || (activeDimension ? activeDimension.key : null)
      )
      
      if (res.disambiguation_required) {
        setDisambiguation({ alternatives: res.alternatives, text: refineInput })
        setLoading(false)
        return
      }

      if (res.zero_results) {
        setZeroResultWarning(`Adding '${res.rejected_clue.value}' removed all results. Kept previous search.`)
        setTimeout(() => setZeroResultWarning(null), 4000)
      } else {
        setZeroResultWarning(null)
      }

      res = fixUrls(res)
      setSession(res)
      setRefineInput('')
      setActiveDimension(null)
      setDisambiguation(null)
      setIsRefineScreenOpen(false)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const toggleSearchMode = () => {
    setIsSearchMode(true)
    setIsRefineScreenOpen(false)
    // Auto-focus the search input after switching
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const exitSearchMode = () => {
    setIsSearchMode(false)
    setIsRefineScreenOpen(false)
    search('').then(res => setSession(fixUrls(res)))
    setQuery('')
    setStagedClues([])
  }

  const previewOverlay = selectedPhoto ? (
    <div className="photo-preview-overlay" onClick={() => setSelectedPhoto(null)}>
      <button className="preview-close-btn" onClick={() => setSelectedPhoto(null)}>
        <X size={24} />
      </button>
      <div className="photo-preview-content" onClick={(e) => e.stopPropagation()}>
        {hasActiveSearch && selectedPhoto.match_percentage != null && (
          <div className="preview-match-header">
            <div className={`preview-match-badge ${selectedPhoto.match_percentage >= 90 ? 'match-high' : selectedPhoto.match_percentage >= 75 ? 'match-med' : 'match-low'}`}>
              <Sparkles size={14} className="match-badge-sparkle" />
              <span>{selectedPhoto.match_percentage}% Relevance Match</span>
            </div>
            {selectedPhoto.location?.label && <span className="preview-location-tag">📍 {selectedPhoto.location.label}</span>}
          </div>
        )}
        <img 
          src={selectedPhoto.url} 
          alt="Preview" 
          className="photo-preview-image" 
        />
        {selectedPhoto.scene && (
          <div className="preview-caption">
            {selectedPhoto.scene}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const dimensionConfig = {
    person: { title: 'Who', subtitle: 'Add person(s)', icon: <User size={20} color="#4285f4"/> },
    location: { title: 'Where', subtitle: 'Add place or location', icon: <MapPin size={20} color="#34a853"/> },
    time: { title: 'When', subtitle: 'Add date or time', icon: <Calendar size={20} color="#ea4335"/> },
    activity: { title: 'What happened', subtitle: 'Add activity or event', icon: <Activity size={20} color="#34a853"/> },
    visual: { title: 'What did it look like?', subtitle: 'Add visual details', icon: <Eye size={20} color="#4285f4"/> },
    object: { title: 'Objects', subtitle: 'Add specific items', icon: <Package size={20} color="#fbbc04"/> }
  };

  const photosSource = session?.results?.photos || allPhotos || [];
  const dateGroups = {};
  photosSource.forEach(p => {
    if (!p.timestamp) return;
    const label = p.timestamp.season ? `${p.timestamp.season.charAt(0).toUpperCase() + p.timestamp.season.slice(1)} ${p.timestamp.year}` : `${p.timestamp.year}`;
    if (!dateGroups[label]) dateGroups[label] = { label, count: 0, preview: p.url, val: String(p.timestamp.year) };
    dateGroups[label].count++;
  });
  let topDates = Object.values(dateGroups).sort((a,b) => b.count - a.count).slice(0, 3);
  if (topDates.length === 0 && allPhotos.length > 0) {
    const fallbackGroups = {};
    allPhotos.forEach(p => {
      if (!p.timestamp) return;
      const label = p.timestamp.season ? `${p.timestamp.season.charAt(0).toUpperCase() + p.timestamp.season.slice(1)} ${p.timestamp.year}` : `${p.timestamp.year}`;
      if (!fallbackGroups[label]) fallbackGroups[label] = { label, count: 0, preview: p.url, val: String(p.timestamp.year) };
      fallbackGroups[label].count++;
    });
    topDates = Object.values(fallbackGroups).sort((a,b) => b.count - a.count).slice(0, 3);
  }

  // Ensure active date filter is always present and first in topDates
  const activeTimeClue = activeClues.find(c => c.dimension === 'time');
  if (activeTimeClue) {
    const activeVal = activeTimeClue.value.toLowerCase();
    const existingIndex = topDates.findIndex(d => d.val.toLowerCase() === activeVal || d.label.toLowerCase().includes(activeVal));
    if (existingIndex > 0) {
      const [item] = topDates.splice(existingIndex, 1);
      topDates.unshift(item);
    } else if (existingIndex === -1) {
      const matchPhoto = allPhotos.find(p => String(p.timestamp?.year) === activeVal || p.timestamp?.season?.toLowerCase() === activeVal);
      topDates.unshift({
        label: activeTimeClue.value.charAt(0).toUpperCase() + activeTimeClue.value.slice(1),
        count: allPhotos.filter(p => String(p.timestamp?.year) === activeVal || p.timestamp?.season?.toLowerCase() === activeVal).length,
        preview: matchPhoto?.url || allPhotos[0]?.url || '',
        val: activeTimeClue.value
      });
    }
  }

  const isDateSelected = (dateVal, dateLabel) => {
    return isStaged(dateVal, 'time') || 
      activeClues.some(c => c.dimension === 'time' && (
        c.value.toLowerCase() === dateVal.toLowerCase() || 
        dateLabel.toLowerCase().includes(c.value.toLowerCase()) || 
        c.value.toLowerCase().includes(dateVal.toLowerCase())
      ));
  };

  const handleDateClick = async (dateVal, dateLabel) => {
    const activeMatch = activeClues.find(c => c.dimension === 'time' && (
      c.value.toLowerCase() === dateVal.toLowerCase() || 
      dateLabel.toLowerCase().includes(c.value.toLowerCase()) || 
      c.value.toLowerCase().includes(dateVal.toLowerCase())
    ));
    if (activeMatch) {
      await handleRemoveClue(activeMatch.clue_id);
      return;
    }
    toggleStagedClue(dateVal, 'time');
  };

  const collectionsMap = {};
  allPhotos.forEach(photo => {
    if (photo.people && photo.people.length > 0) {
      photo.people.forEach(person => {
        if (!collectionsMap[person]) collectionsMap[person] = [];
        collectionsMap[person].push(photo);
      });
    }
  });
  
  const collectionsData = Object.keys(collectionsMap).map(name => ({
    name,
    images: collectionsMap[name]
  }));

  if (!isSearchMode) {

    const triggerSearch = async (text) => {
      setQuery(text);
      setIsSearchMode(true);
      setIsRefineScreenOpen(false);
      setLoading(true);
      try {
        let res = await search(text);
        res = fixUrls(res);
        setSession(res);
        setActiveDimension(null);
      } catch(err) { console.error(err) } finally { setLoading(false) }
    };

    return (
      <div className="home-layout">
        <main className="home-main">
          {activeTab === 'photos' ? (
            <>
              <div className="memories-carousel">
                <div className="memory-card">
                  <div className="memory-overlay"></div>
                  {allPhotos.length > 0 && <img src={allPhotos[0].url} alt="" />}
                  <div className="memory-title">Featured scenes<br/><span>Sep – Nov 2024</span></div>
                </div>
                <div className="memory-card">
                  <div className="memory-overlay"></div>
                  {allPhotos.length > 1 && <img src={allPhotos[allPhotos.length - 1].url} alt="" />}
                  <div className="memory-title">Best of<br/>October 2021</div>
                </div>
                <div className="memory-card">
                  <div className="memory-overlay"></div>
                  {allPhotos.length > 2 && <img src={allPhotos[2].url} alt="" />}
                  <div className="memory-title">Nagpur<br/><span>Over the years</span></div>
                </div>
              </div>

              <div className="photo-grid-grouped">
                <div className="grid-date">Recent</div>
                <div className="photo-grid">
                  {allPhotos.map(photo => (
                    <div key={photo.photo_id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
                      <img src={photo.url} alt="Photo" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="collections-view" style={{ padding: '20px', paddingBottom: '100px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-main)' }}>People</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '20px' }}>
                {collectionsData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => triggerSearch(c.name)}>
                    <img src={c.images[0]?.url} alt={c.name} style={{ width: '80px', height: '80px', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-main)', textAlign: 'center' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <div className="nav-pill">
            <button className={`nav-item ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}><ImageIcon size={18}/> Photos</button>
            <button className={`nav-item ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}><Users size={18}/> Collections</button>
          </div>
          <button className="fab-search" onClick={toggleSearchMode}>
            <Sparkles size={22} />
          </button>
        </nav>
        {previewOverlay}
      </div>
    )
  }

  return (
    <div className="search-layout">
      <header className="top-header">
        <button className="back-btn" onClick={exitSearchMode} title="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="header-title-area">
          <div className="search-input-wrapper">
            <div className="search-left-icon">
              <Search size={19} />
            </div>
            <input 
              ref={searchInputRef}
              autoFocus={!hasActiveSearch}
              type="text" 
              placeholder="Search or ask photos"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
            />
            <div className="search-actions-cluster">
              {query.trim().length > 0 && (
                <>
                  <button 
                    className="search-action-btn"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    title="Clear query"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    className="search-action-btn search-submit-btn"
                    onClick={handleSearch}
                    title="Search"
                  >
                    <Search size={18} />
                  </button>
                </>
              )}
              <button 
                className={`search-action-btn ${isRefineScreenOpen ? 'filter-active' : ''}`}
                onClick={async () => {
                  if (query.trim()) {
                    await handleSearch(null);
                  }
                  setIsRefineScreenOpen(!isRefineScreenOpen);
                }}
                title="Filter / Refine options"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {hasActiveSearch && !isRefineScreenOpen && (
        <div className="search-filter-toolbar">
          <div className="filter-toolbar-inner">
            {/* Primary Refine Search Action */}
            <button 
              className="toolbar-refine-btn"
              onClick={() => {
                setActiveDimension(null);
                setIsRefineScreenOpen(true);
              }}
              title="Open refine and filter options"
            >
              <SlidersHorizontal size={15} />
              <span>Refine search</span>
              {activeClues.length > 0 && (
                <span className="toolbar-refine-badge">{activeClues.length}</span>
              )}
            </button>

            <div className="toolbar-divider" />

            {/* Quick Filter Category Pills */}
            <div className="toolbar-pills-scroll">
              {/* Date / Time */}
              {(() => {
                const dateClues = activeClues.filter(c => c.dimension === 'time');
                if (dateClues.length > 0) {
                  return dateClues.map(c => (
                    <div 
                      key={c.clue_id} 
                      className="category-pill active"
                      onClick={() => {
                        setActiveDimension('time');
                        setIsRefineScreenOpen(true);
                      }}
                      title="Date filter active - click to edit"
                    >
                      <Calendar size={14} className="pill-icon" />
                      <span>Date: {c.value}</span>
                      <button 
                        className="pill-remove-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClue(c.clue_id);
                        }}
                        title={`Remove date filter ${c.value}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ));
                }
                return (
                  <button 
                    className="category-pill"
                    onClick={() => {
                      setActiveDimension('time');
                      setIsRefineScreenOpen(true);
                    }}
                    title="Filter by date"
                  >
                    <Calendar size={14} className="pill-icon" />
                    <span>Date</span>
                    <ChevronDown size={13} className="pill-caret" />
                  </button>
                );
              })()}

              {/* Location */}
              {(() => {
                const locClues = activeClues.filter(c => c.dimension === 'location');
                if (locClues.length > 0) {
                  return locClues.map(c => (
                    <div 
                      key={c.clue_id} 
                      className="category-pill active"
                      onClick={() => {
                        setActiveDimension('location');
                        setIsRefineScreenOpen(true);
                      }}
                      title="Location filter active - click to edit"
                    >
                      <MapPin size={14} className="pill-icon" />
                      <span>Where: {c.value}</span>
                      <button 
                        className="pill-remove-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClue(c.clue_id);
                        }}
                        title={`Remove location filter ${c.value}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ));
                }
                return (
                  <button 
                    className="category-pill"
                    onClick={() => {
                      setActiveDimension('location');
                      setIsRefineScreenOpen(true);
                    }}
                    title="Filter by location"
                  >
                    <MapPin size={14} className="pill-icon" />
                    <span>Location</span>
                    <ChevronDown size={13} className="pill-caret" />
                  </button>
                );
              })()}

              {/* People */}
              {(() => {
                const personClues = activeClues.filter(c => c.dimension === 'person');
                if (personClues.length > 0) {
                  return personClues.map(c => (
                    <div 
                      key={c.clue_id} 
                      className="category-pill active"
                      onClick={() => {
                        setActiveDimension('person');
                        setIsRefineScreenOpen(true);
                      }}
                      title="Person filter active - click to edit"
                    >
                      <Users size={14} className="pill-icon" />
                      <span>Who: {c.value}</span>
                      <button 
                        className="pill-remove-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClue(c.clue_id);
                        }}
                        title={`Remove person filter ${c.value}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ));
                }
                return (
                  <button 
                    className="category-pill"
                    onClick={() => {
                      setActiveDimension('person');
                      setIsRefineScreenOpen(true);
                    }}
                    title="Filter by person"
                  >
                    <Users size={14} className="pill-icon" />
                    <span>People</span>
                    <ChevronDown size={13} className="pill-caret" />
                  </button>
                );
              })()}

              {/* Objects */}
              {(() => {
                const objClues = activeClues.filter(c => c.dimension === 'object');
                if (objClues.length > 0) {
                  return objClues.map(c => (
                    <div 
                      key={c.clue_id} 
                      className="category-pill active"
                      onClick={() => {
                        setActiveDimension('object');
                        setIsRefineScreenOpen(true);
                      }}
                      title="Object filter active - click to edit"
                    >
                      <Package size={14} className="pill-icon" />
                      <span>Object: {c.value}</span>
                      <button 
                        className="pill-remove-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClue(c.clue_id);
                        }}
                        title={`Remove object filter ${c.value}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ));
                }
                return (
                  <button 
                    className="category-pill"
                    onClick={() => {
                      setActiveDimension('object');
                      setIsRefineScreenOpen(true);
                    }}
                    title="Filter by objects"
                  >
                    <Package size={14} className="pill-icon" />
                    <span>Objects</span>
                    <ChevronDown size={13} className="pill-caret" />
                  </button>
                );
              })()}

              {/* Other Active Clues (What happened, visual style, etc.) */}
              {activeClues.filter(c => !['time', 'location', 'person', 'object'].includes(c.dimension)).map(c => {
                const dimTitle = dimensionConfig[c.dimension]?.title || (c.dimension ? c.dimension.charAt(0).toUpperCase() + c.dimension.slice(1) : 'Detail');
                return (
                  <div 
                    key={c.clue_id} 
                    className="category-pill active"
                    onClick={() => {
                      setActiveDimension(c.dimension);
                      setIsRefineScreenOpen(true);
                    }}
                    title={`${dimTitle} filter active`}
                  >
                    <Activity size={14} className="pill-icon" />
                    <span>{dimTitle}: {c.value}</span>
                    <button 
                      className="pill-remove-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveClue(c.clue_id);
                      }}
                      title={`Remove filter ${c.value}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="toolbar-bottom-bar">
            {session?.results?.photos?.length > 0 && (
              <div className="toolbar-results-count">
                {session.results.photos.length} {session.results.photos.length === 1 ? 'photo' : 'photos'}
              </div>
            )}

            {zeroResultWarning && (
              <div className="zero-result-warning" style={{ background: '#3c4043', color: '#f28b82', padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>
                {zeroResultWarning}
              </div>
            )}
          </div>
        </div>
      )}

      {isRefineScreenOpen && (
        <>
          <div 
            className="refine-backdrop" 
            onClick={() => {
              setIsRefineScreenOpen(false);
              setActiveDimension(null);
            }}
          />
          <div className="refine-screen">
            <div className="refine-scroll-content">
              <div className="refine-handle"></div>
            
            <div className="refine-header-modern">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h2 style={{ margin: 0 }}>{hasActiveSearch ? "Can't find the exact photo?" : "Filter your search"}</h2>
                <button 
                  className="refine-close-btn"
                  onClick={() => {
                    setIsRefineScreenOpen(false);
                    setActiveDimension(null);
                  }}
                  title="Close filter"
                  aria-label="Close filter"
                >
                  <X size={18} />
                </button>
              </div>
              <p>{hasActiveSearch ? `I found many ${query || activeClues[0]?.value || 'photos'}. The best way to narrow this down is by date.` : "Add details to find exactly what you're looking for."}</p>
            
            {(activeClues.length > 0 || stagedClues.length > 0) && (
              <div style={{marginBottom: '16px'}}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                  Filters selected in this search:
                </div>
                <div className="clue-chips" style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {activeClues.map(c => {
                    const dimLabel = dimensionConfig[c.dimension]?.title || (c.dimension ? c.dimension.charAt(0).toUpperCase() + c.dimension.slice(1) : 'Filter');
                    return (
                      <div key={c.clue_id} className="active-query-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e8f0fe', color: '#0a56d9', border: '1px solid #b7d1f9' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase' }}>{dimLabel}:</span>
                        <span style={{ fontWeight: '600' }}>{c.value.charAt(0).toUpperCase() + c.value.slice(1)}</span>
                        <button onClick={() => handleRemoveClue(c.clue_id)} title={`Remove ${dimLabel} filter`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                          <X size={14} color="#0a56d9" />
                        </button>
                      </div>
                    );
                  })}
                  {stagedClues.map((c, i) => {
                    const dimLabel = dimensionConfig[c.dimension]?.title || (c.dimension ? c.dimension.charAt(0).toUpperCase() + c.dimension.slice(1) : 'Detail');
                    return (
                      <div key={`staged-${i}`} className="active-query-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1.5px dashed #0a56d9', background: '#f8fafd', color: '#0a56d9' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase' }}>+ {dimLabel}:</span>
                        <span style={{ fontWeight: '600' }}>{c.text.charAt(0).toUpperCase() + c.text.slice(1)}</span>
                        <button onClick={() => toggleStagedClue(c.text, c.dimension)} title={`Remove ${c.text}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                          <X size={14} color="#0a56d9" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


          </div>
          
          <div className="refine-section-blue">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0 }}>Try a date</h3>
              {activeClues.some(c => c.dimension === 'time') && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#0a56d9', background: '#e8f0fe', padding: '2px 8px', borderRadius: '12px' }}>
                  ✓ Selected: {activeClues.find(c => c.dimension === 'time')?.value}
                </span>
              )}
            </div>
            <p>These dates have the most relevant photos based on your library.</p>
            <div className="date-cards-scroll">
               {topDates.map((dateObj, idx) => {
                 const selected = isDateSelected(dateObj.val, dateObj.label);
                 return (
                   <div 
                     key={idx} 
                     className={`date-card-modern ${selected ? 'selected' : ''}`} 
                     onClick={() => handleDateClick(dateObj.val, dateObj.label)} 
                     style={{ cursor: 'pointer', position: 'relative' }}
                   >
                      {selected && (
                        <div className="card-selected-check-badge">
                          <Check size={11} color="#ffffff" strokeWidth={3} />
                        </div>
                      )}
                      <img src={dateObj.preview} alt={dateObj.label} />
                      <div className="date-card-label">
                        {dateObj.label}<br/>
                        <span style={{ color: selected ? '#0a56d9' : '#5f6368', fontWeight: selected ? '600' : '400' }}>
                          {selected ? '✓ Selected' : `${dateObj.count} photos`}
                        </span>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>

          <div className="refine-section-white">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0 }}>Add more details</h3>
              {activeClues.some(c => ['activity', 'location', 'person', 'object'].includes(c.dimension)) && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#0a56d9', background: '#e8f0fe', padding: '2px 8px', borderRadius: '12px' }}>
                  {activeClues.filter(c => ['activity', 'location', 'person', 'object'].includes(c.dimension)).length} filter(s) active
                </span>
              )}
            </div>
            <p>Narrow down with other details you remember.</p>
            <div className="detail-buttons-grid">
               {DETAIL_DIMENSIONS.map(dim => {
                 const activeForThisDim = activeClues.filter(c => c.dimension === dim.key);
                 const stagedForThisDim = stagedClues.filter(c => c.dimension === dim.key);
                 const hasApplied = activeForThisDim.length > 0 || stagedForThisDim.length > 0;
                 const appliedTexts = [
                   ...activeForThisDim.map(c => c.value),
                   ...stagedForThisDim.map(c => c.text)
                 ];

                 return (
                   <button 
                     key={dim.key}
                     className={`detail-btn ${activeDimension === dim.key ? 'active' : ''} ${hasApplied ? 'has-applied-filter' : ''}`} 
                     onClick={() => setActiveDimension(activeDimension === dim.key ? null : dim.key)}
                     style={{
                       position: 'relative'
                     }}
                   >
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                       {dimensionConfig[dim.key]?.icon || <Search size={22} color="#5f6368" />}
                       {hasApplied && (
                         <div style={{
                           width: '16px',
                           height: '16px',
                           borderRadius: '50%',
                           background: '#0a56d9',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}>
                           <Check size={10} color="#fff" strokeWidth={3} />
                         </div>
                       )}
                     </div>
                     <span style={{ fontWeight: hasApplied ? '600' : '500', color: hasApplied ? '#0a56d9' : '#1f2937' }}>
                       {dim.label}
                     </span>
                     {hasApplied && (
                       <span className="detail-btn-applied-pill" title={appliedTexts.join(', ')}>
                         {appliedTexts[0].charAt(0).toUpperCase() + appliedTexts[0].slice(1)}
                         {appliedTexts.length > 1 ? ` +${appliedTexts.length - 1}` : ''}
                       </span>
                     )}
                   </button>
                 );
               })}
            </div>
          </div>

          {activeDimension && !disambiguation && (
            <div className="refinement-suggestions-area" style={{padding: '0 24px 8px 24px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                  {dimensionConfig[activeDimension]?.title} suggestions:
                </span>
                <span style={{ fontSize: '12px', color: '#5f6368' }}>Tap to select or deselect</span>
              </div>
              {(() => {
                let suggestedVals = [...(session?.suggestions?.dimensions?.find(d => d.key === activeDimension)?.suggested_values || [])];
                
                // For person dimension, also include all people from the photo library
                if (activeDimension === 'person') {
                  const allPeopleSet = new Set(suggestedVals.map(s => s.toLowerCase()));
                  const displayMap = {};
                  suggestedVals.forEach(s => { displayMap[s.toLowerCase()] = s; });
                  Object.keys(collectionsMap).forEach(p => {
                    if (!allPeopleSet.has(p.toLowerCase())) {
                      allPeopleSet.add(p.toLowerCase());
                      displayMap[p.toLowerCase()] = p;
                    }
                  });
                  suggestedVals = Array.from(allPeopleSet).map(k => displayMap[k]);
                }

                // For location dimension, also extract unique locations from all photos
                if (activeDimension === 'location') {
                  const locSet = new Set(suggestedVals.map(s => s.toLowerCase()));
                  const displayMap = {};
                  suggestedVals.forEach(s => { displayMap[s.toLowerCase()] = s; });
                  allPhotos.forEach(p => {
                    if (p.location?.label && !locSet.has(p.location.label.toLowerCase())) {
                      locSet.add(p.location.label.toLowerCase());
                      displayMap[p.location.label.toLowerCase()] = p.location.label;
                    }
                  });
                  suggestedVals = Array.from(locSet).map(k => displayMap[k]);
                }

                // Add any custom typed clues that are currently active or staged for this dimension
                const activeForDim = activeClues.filter(c => c.dimension === activeDimension).map(c => c.value);
                const stagedForDim = stagedClues.filter(c => c.dimension === activeDimension).map(c => c.text);
                const allSelected = [...new Set([...activeForDim, ...stagedForDim])];

                // Prepend selected values to the front so they are immediately visible
                allSelected.reverse().forEach(text => {
                  suggestedVals = [text, ...suggestedVals.filter(v => v.toLowerCase() !== text.toLowerCase())];
                });

                if (suggestedVals.length > 0) {
                  const hasMultipleResults = (session?.results?.photos?.length || 0) > 1;
                  const usedUrls = new Set();
                  
                  return (
                    <div className="date-cards-scroll" style={{marginBottom: '4px'}}>
                      {suggestedVals.map(s => {
                        const sLower = String(s).toLowerCase();
                        
                        const isPhotoMatch = (p) => {
                          if (activeDimension === 'person') {
                            return p.people?.some(name => name.toLowerCase() === sLower) || 
                                   p.objects?.some(o => o.toLowerCase() === sLower);
                          }
                          if (activeDimension === 'location') {
                            return p.location?.label?.toLowerCase() === sLower || 
                                   p.location?.type?.toLowerCase() === sLower;
                          }
                          if (activeDimension === 'time') {
                            return p.timestamp?.season?.toLowerCase() === sLower || 
                                   String(p.timestamp?.year) === s;
                          }
                          if (activeDimension === 'activity') {
                            return p.objects?.some(o => o.toLowerCase() === sLower) || 
                                   p.scene?.toLowerCase().includes(sLower);
                          }
                          if (activeDimension === 'visual') {
                            return p.visual_attributes?.dominant_colors?.some(c => c.toLowerCase() === sLower) ||
                                   p.scene?.toLowerCase().includes(sLower);
                          }
                          if (activeDimension === 'object') {
                            return p.objects?.some(o => o.toLowerCase() === sLower);
                          }
                          return JSON.stringify(p).toLowerCase().includes(sLower);
                        };

                        let candidatePhotos = hasMultipleResults 
                          ? session.results.photos.filter(isPhotoMatch) 
                          : [];
                        if (candidatePhotos.length === 0) {
                          candidatePhotos = (allPhotos || []).filter(isPhotoMatch);
                        }
                        
                        const distinctPhoto = candidatePhotos.find(p => !usedUrls.has(p.url)) || candidatePhotos[0];
                        if (distinctPhoto) {
                          usedUrls.add(distinctPhoto.url);
                        }
                        const previewUrl = distinctPhoto?.url || allPhotos?.[0]?.url || 'https://via.placeholder.com/150';

                        const currentResultsCount = session?.results?.photos?.filter(isPhotoMatch).length || 0;
                        const libraryCount = (allPhotos || []).filter(isPhotoMatch).length;
                        const countMatch = (hasMultipleResults && currentResultsCount > 0) ? currentResultsCount : libraryCount;

                        const isCardSelected = isStaged(String(s), activeDimension) || 
                                               activeClues.some(c => c.dimension === activeDimension && (c.value.toLowerCase() === sLower || sLower.includes(c.value.toLowerCase())));

                        return (
                          <div 
                            key={s} 
                            className={`date-card-modern ${isCardSelected ? 'selected' : ''}`} 
                            onClick={async (e) => {
                              e.preventDefault();
                              const activeMatch = activeClues.find(c => c.dimension === activeDimension && (c.value.toLowerCase() === sLower || sLower.includes(c.value.toLowerCase())));
                              if (activeMatch) {
                                await handleRemoveClue(activeMatch.clue_id);
                                return;
                              }
                              toggleStagedClue(String(s), activeDimension);
                            }}
                            style={{ cursor: 'pointer', minWidth: '100px', width: '100px', position: 'relative' }}
                          >
                            {isCardSelected && (
                              <div className="card-selected-check-badge">
                                <Check size={11} color="#ffffff" strokeWidth={3} />
                              </div>
                            )}
                            <img src={previewUrl} style={{height: '70px', objectFit: 'cover'}} alt={s} />
                            <div className="date-card-label" style={{padding: '6px 4px', fontSize: '13px'}}>
                              {s}<br/>
                              <span style={{ fontSize: '11px', color: isCardSelected ? '#0a56d9' : '#5f6368', fontWeight: isCardSelected ? '600' : '400' }}>
                                {isCardSelected ? '✓ Selected' : `(${countMatch})`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* SEARCH BOX: ALWAYS VISIBLE */}
          <div className="refine-input-container" style={{padding: '8px 24px 16px 24px'}}>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if (refineInput.trim()) {
                toggleStagedClue(refineInput.trim(), activeDimension || null);
                setRefineInput('');
              }
            }} style={{display: 'flex', gap: '8px', width: '100%', alignItems: 'center'}}>
              <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Search size={18} color="#5f6368" style={{position: 'absolute', left: '14px', pointerEvents: 'none'}} />
                <input 
                  type="text" 
                  placeholder={activeDimension ? `Add ${dimensionConfig[activeDimension]?.title.toLowerCase()}...` : "Add details (e.g. sunset, beach, dog)..."}
                  value={refineInput}
                  onChange={e => setRefineInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '24px',
                    border: '1.5px solid #d2d6db',
                    background: '#f8fafc',
                    color: '#1f2937',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={!refineInput.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '24px',
                  background: refineInput.trim() ? '#0a56d9' : '#e8eaed',
                  color: refineInput.trim() ? '#ffffff' : '#9aa0a6',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: refineInput.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                Apply
              </button>
            </form>
          </div>
          </div>

          <div className="refine-bottom-fixed">
            <button className="update-results-btn-primary" onClick={async (e) => {
              let finalStaged = [...stagedClues];
              if (refineInput.trim()) {
                finalStaged.push({ text: refineInput.trim(), dimension: activeDimension || null });
              }
              
              if (finalStaged.length === 0 && !query.trim()) {
                setIsRefineScreenOpen(false);
                return;
              }
              
              setLoading(true);
              try {
                let res = session;
                
                if (query.trim()) {
                  if (hasActiveSearch) {
                    res = await refineSession(res.session_id, query.trim());
                  } else {
                    res = await search(query.trim());
                  }
                  setQuery('');
                }
                for (const clue of finalStaged) {
                  res = await refineSession(res.session_id, clue.text, clue.dimension);
                  if (res.disambiguation_required) {
                    setDisambiguation({ alternatives: res.alternatives, text: clue.text });
                    setSession(res);
                    setLoading(false);
                    return;
                  }
                }
                setSession(res);
                setStagedClues([]);
                setRefineInput('');
                setActiveDimension(null);
                setIsRefineScreenOpen(false);
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false);
              }
            }}>
              Show results
            </button>
          </div>
        </div>
      </>
    )}

      <main style={{ paddingBottom: isRefineScreenOpen ? '75vh' : '24px', display: 'block', transition: 'padding-bottom 0.3s' }}>
        {loading && <div style={{textAlign: 'center', marginTop: '40px'}}><Loader2 className="animate-spin" size={32} /></div>}
        
        {hasActiveSearch && session?.refinement_history?.length > 1 && (
          <div className="narrowing-path" style={{ padding: '0 20px 16px 20px', fontSize: '13px', color: '#5f6368', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            {session.refinement_history.map((step, i) => {
              const activeClues = step.clues_state.filter(c => c.active);
              const lastClue = activeClues[activeClues.length - 1];
              const label = i === 0 
                ? (activeClues.length > 0 ? `Search: "${activeClues[0]?.value || 'All'}"` : 'All photos')
                : `+ ${lastClue?.value || 'Filter'}`;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>→ {step.result_count}</span>
                  {i < session.refinement_history.length - 1 && <span style={{ opacity: 0.5 }}>•</span>}
                </div>
              );
            })}
          </div>
        )}

        {session && !loading && session.results.photos.length > 0 && (
          <div className="photo-grid">
            {session.results.photos.map(photo => (
              <div key={photo.photo_id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.url} alt="Photo" />
                {hasActiveSearch && photo.match_percentage != null && (
                  <div 
                    className={`match-badge ${photo.match_percentage >= 90 ? 'match-high' : photo.match_percentage >= 75 ? 'match-med' : 'match-low'}`}
                    title={`${photo.match_percentage}% match`}
                  >
                    <Sparkles size={10} className="match-badge-sparkle" />
                    <span>{photo.match_percentage}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {session && !loading && session.results.photos.length === 0 && session.results.relaxed_photos?.length > 0 && (
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '8px' }}>No exact matches found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>Here are some photos that match some of your filters:</p>
            <div className="photo-grid">
              {session.results.relaxed_photos.map(photo => (
                <div key={photo.photo_id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo.url} alt="Photo" />
                  {photo.match_percentage != null && (
                    <div 
                      className="match-badge match-relaxed"
                      title={`${photo.match_percentage}% partial match`}
                    >
                      <span>{photo.match_percentage}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {session && !loading && session.results.photos.length === 0 && (!session.results.relaxed_photos || session.results.relaxed_photos.length === 0) && (
           <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
             No photos match these filters.
           </div>
        )}
      </main>
      


      {previewOverlay}
    </div>
  )
}

export default App
