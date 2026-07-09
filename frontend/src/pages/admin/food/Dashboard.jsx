import { useState, useEffect, useRef, useMemo } from 'react';
import { FiUsers, FiShoppingBag, FiTruck, FiDollarSign, FiActivity, FiCalendar, FiLayers, FiBarChart2, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import { authService } from '../../../services/authService';
import '../../../styles/dashboard.css';

export default function AdminFoodDashboard({ domain = 'food' }) {
  const [orders, setOrders] = useState([]);
  const [sellersCount, setSellersCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [buyersCount, setBuyersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Chart states
  const [chartView, setChartView] = useState('main'); // 'main' (Food vs Grocery) or 'sub' (active domain subcategories)
  const [timelinePreset, setTimelinePreset] = useState('all'); // '7days', '30days', 'all', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scrubIndex, setScrubIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const graphRef = useRef(null);
  const svgRef = useRef(null);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const blob = await authService.downloadSystemReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FreshKart_System_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download system report:", error);
      alert("Error: Failed to generate or download the system report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      await authService.uploadSystemLogo(file);
      alert("Success: Logo uploaded successfully! All generated PDF reports will now use this logo.");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      const serverError = error.response?.data?.error || error.message;
      alert(`Error: Failed to upload the logo. Details: ${serverError}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [ordersData, sellersList, deliveryList, buyersList] = await Promise.all([
          orderService.getAdminOrders(),
          authService.getUsersByRole('seller'),
          authService.getUsersByRole('delivery'),
          authService.getUsersByRole('buyer')
        ]);
        setOrders(ordersData || []);
        setSellersCount(sellersList?.length || 0);
        setDeliveryCount(deliveryList?.length || 0);
        setBuyersCount(buyersList?.length || 0);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [domain]);

  // Filter completed and pending orders for the ACTIVE dashboard domain
  const activeCompleted = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'completed' || o.status === 'delivered') &&
      (o.domain || 'food').toLowerCase() === domain.toLowerCase()
    );
  }, [orders, domain]);

  const activePending = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'pending') &&
      (o.domain || 'food').toLowerCase() === domain.toLowerCase()
    );
  }, [orders, domain]);

  // Overall platform-wide completed orders (used for comparing Food vs Grocery)
  const allCompletedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed' || o.status === 'delivered');
  }, [orders]);

  const activeTotalRevenue = useMemo(() => {
    return activeCompleted.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }, [activeCompleted]);

  // Today's orders for the active domain
  const todayOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => 
      o.created_at && 
      new Date(o.created_at).toDateString() === todayStr &&
      (o.domain || 'food').toLowerCase() === domain.toLowerCase()
    );
  }, [orders, domain]);

  const newRegistrationsCount = sellersCount + deliveryCount + buyersCount;

  // Timeline preset helper
  const getPresetDates = (preset, ordersList) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (preset === '7days') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      return { start: start.toISOString().split('T')[0], end: todayStr };
    } else if (preset === '30days') {
      const start = new Date();
      start.setDate(today.getDate() - 29);
      return { start: start.toISOString().split('T')[0], end: todayStr };
    } else {
      // 'all'
      if (!ordersList || ordersList.length === 0) {
        const start = new Date();
        start.setDate(today.getDate() - 30);
        return { start: start.toISOString().split('T')[0], end: todayStr };
      }
      
      let minTime = Infinity;
      let maxTime = -Infinity;
      ordersList.forEach(o => {
        if (o.created_at) {
          const t = new Date(o.created_at).getTime();
          if (t < minTime) minTime = t;
          if (t > maxTime) maxTime = t;
        }
      });
      
      const startStr = new Date(minTime).toISOString().split('T')[0];
      const endStr = new Date(maxTime).toISOString().split('T')[0];
      return { start: startStr, end: endStr };
    }
  };

  // Update date ranges when preset changes
  useEffect(() => {
    if (orders.length > 0) {
      const targetOrders = chartView === 'main' ? allCompletedOrders : activeCompleted;
      const { start, end } = getPresetDates(timelinePreset, targetOrders);
      setStartDate(start);
      setEndDate(end);
    }
  }, [orders, timelinePreset, chartView, allCompletedOrders, activeCompleted]);

  // Construct dates list for timeline range
  const datesList = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    // Cap at reasonable safety limits (max 365 days)
    let loopCount = 0;
    while (curr <= end && loopCount < 365) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      loopCount++;
    }
    return dates;
  }, [startDate, endDate]);

  // Reset or cap scrubIndex when datesList changes
  useEffect(() => {
    if (datesList.length > 0) {
      setScrubIndex(datesList.length - 1);
    }
  }, [datesList]);

  // Categories list for active chart view
  const categories = useMemo(() => {
    if (chartView === 'main') {
      return ['Food', 'Grocery'];
    } else {
      // Get all unique categories in completed orders of active domain
      const cats = new Set();
      activeCompleted.forEach(o => {
        o.items?.forEach(item => {
          if (item.category) {
            cats.add(item.category);
          }
        });
      });
      return cats.size > 0 ? Array.from(cats) : ['Other'];
    }
  }, [chartView, activeCompleted]);

  // Colors for categories
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4'];
  const getColor = (index) => colors[index % colors.length];

  // Calculate cumulative trend data for the entire timeline
  const fullTrendData = useMemo(() => {
    if (datesList.length === 0) return [];
    
    // Initialize cumulative totals
    const runningTotals = {};
    categories.forEach(c => {
      runningTotals[c] = 0;
    });

    const targetOrders = chartView === 'main' ? allCompletedOrders : activeCompleted;

    // Map day-by-day and accumulate
    return datesList.map(date => {
      const dailySales = {};
      categories.forEach(c => {
        dailySales[c] = 0;
      });

      targetOrders.forEach(o => {
        if (o.created_at && o.created_at.split('T')[0] === date) {
          o.items?.forEach(item => {
            const itemDomain = item.domain || o.domain || 'food';
            const itemCat = item.category || 'Other';
            const targetKey = chartView === 'main'
              ? (itemDomain === 'grocery' ? 'Grocery' : 'Food')
              : itemCat;
              
            if (dailySales[targetKey] !== undefined) {
              dailySales[targetKey] += (item.price || 0) * (item.quantity || 0);
            }
          });
        }
      });

      // Update running cumulative total
      categories.forEach(c => {
        runningTotals[c] += dailySales[c];
      });

      return {
        date,
        ...runningTotals
      };
    });
  }, [datesList, categories, chartView, allCompletedOrders, activeCompleted]);

  // Plotted trend data is sliced based on timeline scrubber progress
  const trendData = useMemo(() => {
    return fullTrendData.slice(0, scrubIndex + 1);
  }, [fullTrendData, scrubIndex]);

  const maxRevenueVal = useMemo(() => {
    if (fullTrendData.length === 0) return 100;
    let max = 0;
    fullTrendData.forEach(d => {
      categories.forEach(c => {
        if ((d[c] || 0) > max) max = d[c];
      });
    });
    return max > 0 ? max : 100;
  }, [fullTrendData, categories]);

  // SVG dimensions
  const svgWidth = 550;
  const svgHeight = 200;
  const plotStart = 50;
  const plotWidth = 480;
  const plotTop = 20;
  const plotHeight = 150;

  // Use datesList.length to fix the X-coordinate timeline scale
  const getX = (index) => plotStart + (index / Math.max(datesList.length - 1, 1)) * plotWidth;
  const getY = (val) => plotTop + plotHeight - (val / maxRevenueVal) * plotHeight;

  // Render SVG Trend Chart
  const renderTrendChart = () => {
    if (trendData.length === 0) return null;

    // Generate paths for each category
    const lines = categories.map((cat, catIdx) => {
      let d = '';
      trendData.forEach((pt, idx) => {
        const x = getX(idx);
        const y = getY(pt[cat] || 0);
        d += `${idx === 0 ? 'M' : 'L'} ${x} ${y} `;
      });

      let areaD = d;
      if (trendData.length > 0) {
        areaD += `L ${getX(trendData.length - 1)} ${plotTop + plotHeight} L ${getX(0)} ${plotTop + plotHeight} Z`;
      }

      const color = chartView === 'main' ? (cat === 'Food' ? '#10b981' : '#6366f1') : getColor(catIdx);

      return { cat, d, areaD, color };
    });

    const handleMouseMove = (e) => {
      if (!svgRef.current || trendData.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (x >= plotStart && x <= plotStart + plotWidth) {
        const pct = (x - plotStart) / plotWidth;
        const index = Math.round(pct * (datesList.length - 1));
        if (index >= 0 && index < trendData.length) {
          setHoveredIndex(index);
          const yVal = Math.min(...categories.map(c => getY(trendData[index][c] || 0)));
          setTooltipPos({
            x: getX(index),
            y: yVal - 10
          });
        } else {
          setHoveredIndex(null);
        }
      }
    };

    return (
      <div style={{ position: 'relative' }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ overflow: 'visible' }}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="foodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
            </linearGradient>
            <linearGradient id="groceryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
            </linearGradient>
            {categories.map((c, i) => (
              <linearGradient key={`grad-${c}`} id={`grad-${c}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getColor(i)} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={getColor(i)} stopOpacity="0.0"/>
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = plotTop + plotHeight * pct;
            const labelVal = Math.round(maxRevenueVal * (1 - pct));
            return (
              <g key={i}>
                <line x1={plotStart} y1={y} x2={plotStart + plotWidth} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={plotStart - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af" fontWeight="500">
                  ₹{labelVal >= 1000 ? (labelVal / 1000).toFixed(1) + 'k' : labelVal}
                </text>
              </g>
            );
          })}

          {/* X axis labels (Start, Mid, End) based on full datesList */}
          {datesList.length > 1 && (
            <>
              <text x={plotStart} y={plotTop + plotHeight + 18} textAnchor="start" fontSize="9" fill="#9ca3af" fontWeight="600">
                {new Date(datesList[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
              <text x={plotStart + plotWidth / 2} y={plotTop + plotHeight + 18} textAnchor="middle" fontSize="9" fill="#9ca3af" fontWeight="600">
                {new Date(datesList[Math.floor(datesList.length / 2)]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
              <text x={plotStart + plotWidth} y={plotTop + plotHeight + 18} textAnchor="end" fontSize="9" fill="#9ca3af" fontWeight="600">
                {new Date(datesList[datesList.length - 1]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
            </>
          )}

          {/* Areas and Lines */}
          {lines.map((l) => (
            <g key={l.cat}>
              {/* Fill */}
              <path 
                d={l.areaD} 
                fill={chartView === 'main' ? (l.cat === 'Food' ? 'url(#foodGrad)' : 'url(#groceryGrad)') : `url(#grad-${l.cat})`}
              />
              {/* Line */}
              <path 
                d={l.d} 
                fill="none" 
                stroke={l.color} 
                strokeWidth={2.5} 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover details */}
          {hoveredIndex !== null && trendData[hoveredIndex] && (
            <g>
              <line 
                x1={getX(hoveredIndex)} 
                y1={plotTop} 
                x2={getX(hoveredIndex)} 
                y2={plotTop + plotHeight} 
                stroke="#d1d5db" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
              />
              {categories.map((c, i) => {
                const color = chartView === 'main' ? (c === 'Food' ? '#10b981' : '#6366f1') : getColor(i);
                return (
                  <circle 
                    key={c}
                    cx={getX(hoveredIndex)} 
                    cy={getY(trendData[hoveredIndex][c] || 0)} 
                    r={5} 
                    fill={color} 
                    stroke="white" 
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="category-legend">
          {categories.map((c, i) => {
            const color = chartView === 'main' ? (c === 'Food' ? '#10b981' : '#6366f1') : getColor(i);
            return (
              <div key={c} className="legend-item">
                <span className="legend-color-dot" style={{ backgroundColor: color }} />
                <span>{c}</span>
              </div>
            );
          })}
        </div>

        {/* Tooltip Popup */}
        {hoveredIndex !== null && trendData[hoveredIndex] && (
          <div 
            className="chart-tooltip" 
            style={{ 
              left: `${(tooltipPos.x / svgWidth) * 100}%`, 
              top: `${tooltipPos.y - 65}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <span className="chart-tooltip-title">
              {new Date(trendData[hoveredIndex].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {categories.map((c, i) => {
              const val = trendData[hoveredIndex][c] || 0;
              const color = chartView === 'main' ? (c === 'Food' ? '#10b981' : '#6366f1') : getColor(i);
              return (
                <div key={c} className="chart-tooltip-item">
                  <span style={{ color, fontWeight: 700 }}>{c}:</span>
                  <span>₹{val.toLocaleString('en-IN')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Category shares breakdown
  const renderCategoryShares = () => {
    if (trendData.length === 0) return <div>No share details.</div>;
    const lastPoint = trendData[trendData.length - 1];
    const total = categories.reduce((sum, c) => sum + (lastPoint[c] || 0), 0);

    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
          No revenue recorded in this period.
        </div>
      );
    }

    const sortedCategories = [...categories]
      .map((c, i) => ({
        name: c,
        value: lastPoint[c] || 0,
        color: chartView === 'main' ? (c === 'Food' ? '#10b981' : '#6366f1') : getColor(i)
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <div className="category-breakdown-list">
        {sortedCategories.map(cat => {
          const pct = ((cat.value / total) * 100).toFixed(1);
          return (
            <div key={cat.name} className="breakdown-row">
              <div className="breakdown-info">
                <span>{cat.name}</span>
                <span>₹{cat.value.toLocaleString('en-IN')} ({pct}%)</span>
              </div>
              <div className="breakdown-progress-container">
                <div 
                  className="breakdown-progress-fill" 
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading admin platform overview...</p></div>;
  }

  return (
    <div className="dashboard-page" id={`admin-${domain}-dashboard`}>
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ textTransform: 'capitalize', margin: 0 }}>Admin {domain} Dashboard 👨‍💼</h1>
          <p style={{ margin: '4px 0 0 0' }}>Platform-wide overview (Dynamic & Verified)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="file" 
            id="logo-upload-input" 
            accept="image/*" 
            onChange={handleLogoUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => document.getElementById('logo-upload-input').click()}
            disabled={uploadingLogo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: '#004F9F',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #004F9F',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: uploadingLogo ? 'not-allowed' : 'pointer',
              opacity: uploadingLogo ? 0.7 : 1,
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            {uploadingLogo ? 'Uploading...' : 'Upload Report Logo'}
          </button>
          <button 
            onClick={handleDownloadReport} 
            disabled={downloading}
            className="admin-download-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#004F9F',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {downloading ? (
              <>
                <span className="spinner-loader" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'admin-spin 1s linear infinite'
                }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FiDownload />
                <span>Download System Report (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Total Revenue Card - Click to Scroll */}
        <div 
          className="stat-card" 
          onClick={() => graphRef.current?.scrollIntoView({ behavior: 'smooth' })} 
          style={{ cursor: 'pointer', border: '1px solid #10b981' }}
        >
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <div className="stat-card-info">
            <h3>₹{activeTotalRevenue.toLocaleString('en-IN')}</h3>
            <p style={{ display: 'flex', flexDirection: 'column' }}>
              <span>Total Platform Revenue</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', textDecoration: 'underline', marginTop: '4px' }}>Click to view graph ↓</span>
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiShoppingBag /></div>
          <div className="stat-card-info">
            <h3>{todayOrders.length}</h3>
            <p>Total Orders Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiUsers /></div>
          <div className="stat-card-info">
            <h3>{sellersCount}</h3>
            <p>Active Sellers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><FiTruck /></div>
          <div className="stat-card-info">
            <h3>{deliveryCount}</h3>
            <p>Active Delivery Partners</p>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="content-card">
        <div className="content-card-header"><h2><FiActivity size={18} /> Platform Activity Breakdown</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Orders Completed', value: activeCompleted.length.toString(), color: '#dcfce7' },
            { label: 'Orders Pending', value: activePending.length.toString(), color: '#fef3c7' },
            { label: 'New Registrations', value: newRegistrationsCount.toString(), color: '#dbeafe' },
            { label: 'Active Users (Buyers)', value: buyersCount.toString(), color: '#fee2e2' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px', background: item.color, borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827' }}>{item.value}</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Analytics Section with Dynamic Timeline ── */}
      <div className="content-card" ref={graphRef} style={{ borderTop: '4px solid var(--color-primary)' }}>
        <div className="content-card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiBarChart2 size={20} /> Revenue Analytics & Progress</h2>
          <div className="chart-toggles">
            <button 
              className={`chart-btn ${chartView === 'main' ? 'active' : ''}`}
              onClick={() => setChartView('main')}
            >
              Main Categories
            </button>
            <button 
              className={`chart-btn ${chartView === 'sub' ? 'active' : ''}`}
              onClick={() => setChartView('sub')}
            >
              Subcategories ({domain})
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="chart-controls-bar">
          <div className="chart-toggles">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Date' }
            ].map(p => (
              <button 
                key={p.id}
                className={`chart-btn ${timelinePreset === p.id ? 'active' : ''}`}
                onClick={() => setTimelinePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {timelinePreset === 'custom' && (
            <div className="chart-date-inputs">
              <input 
                type="date" 
                className="chart-date-input" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>to</span>
              <input 
                type="date" 
                className="chart-date-input" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Timeline Range Scrub Slider */}
        {datesList.length > 1 && (
          <div className="timeline-scrubber" style={{ marginTop: '16px' }}>
            <div className="timeline-slider-label">
              <span>Timeline Progress Scrub Slider</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Progress up to: {new Date(datesList[scrubIndex]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <input 
              type="range" 
              className="timeline-slider"
              min={0}
              max={datesList.length - 1}
              value={scrubIndex}
              onChange={e => setScrubIndex(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af' }}>
              <span>{new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              <span>Scrub to view progress at any point of time</span>
              <span>{new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        )}

        {/* Visualization Grid */}
        <div className="chart-visualization-grid" style={{ marginTop: '24px' }}>
          {/* Progressive Line Chart */}
          <div className="chart-card">
            <h3><FiTrendingUp size={16} /> Cumulative Revenue Progress</h3>
            <div className="chart-wrapper">
              {datesList.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af' }}>
                  No revenue data in selected date range.
                </div>
              ) : (
                renderTrendChart()
              )}
            </div>
          </div>

          {/* Share Breakdown */}
          <div className="chart-card">
            <h3><FiLayers size={16} /> Category Performance Share</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', height: '100%' }}>
              {renderCategoryShares()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
