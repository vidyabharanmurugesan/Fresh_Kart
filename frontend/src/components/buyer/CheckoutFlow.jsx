import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiFileText, FiCreditCard, FiSearch, FiArrowLeft, FiHome, FiBriefcase, FiPlus, FiCheck, FiSmartphone, FiTag } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { couponService } from '../../services/couponService';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- BRAND SVG LOGOS ---
const GoogleGLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l3.66-2.82z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.82c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const GooglePayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <GoogleGLogo />
    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5f6368', fontFamily: 'Outfit, sans-serif' }}>Pay</span>
  </div>
);

const PhonePeLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect width="24" height="24" rx="5" fill="#5f259f" />
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 15a6 6 0 110-12 6 6 0 010 12z" fill="#fff" opacity="0.3" />
      <path d="M13.2 8.4h-2.4v2.4H12c.7 0 1.2-.5 1.2-1.2s-.5-1.2-1.2-1.2zm-2.4 4.8h1.2c.7 0 1.2-.5 1.2-1.2s-.5-1.2-1.2-1.2h-1.2v2.4zm0 2.4H9V7.2h4.2c1.7 0 3 1.3 3 3a3 3 0 01-1.8 2.8 3 3 0 011.8 2.8c0 1.7-1.3 3-3 3h-4.2V15.6z" fill="#fff" />
    </svg>
    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5f259f', fontFamily: 'Outfit, sans-serif' }}>PhonePe</span>
  </div>
);

const PaytmLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#00b4f0', fontStyle: 'italic', fontFamily: 'sans-serif' }}>pay</span>
    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#002e7e', fontStyle: 'italic', fontFamily: 'sans-serif' }}>tm</span>
  </div>
);

const AmazonPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', position: 'relative', height: '14px', marginBottom: '2px' }}>
    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111', fontFamily: 'sans-serif' }}>amazon</span>
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ff9900', fontFamily: 'sans-serif' }}>pay</span>
    <svg width="45" height="10" viewBox="0 0 50 15" fill="none" style={{ position: 'absolute', bottom: '-7px', left: 0 }}>
      <path d="M2 2c15 8 30 8 46 0" stroke="#ff9900" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M43 4l5-2-2 5" stroke="#ff9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const VisaLogo = () => (
  <svg width="34" height="11" viewBox="0 0 36 12" fill="none" style={{ flexShrink: 0 }}>
    <path d="M13.6 0.2l-2.2 8.4h-1.8L7.4 2.2c-.3-.9-.6-1.2-1.3-1.6L5.3 0.2h3.2c.4 0 .8.3.9.8l1.4 5.9 2-6.7h1.8v-.2zm9.1 5.9c0-2-2.7-2.1-2.7-3.1 0-.3.3-.6.9-.6.8 0 1.5.3 1.9.5l.3-1.5c-.5-.2-1.2-.4-2-.4-1.9 0-3.2 1-3.2 2.5 0 2.2 3.1 2.3 3.1 3.5 0 .4-.4.7-1 .7-1.1 0-1.7-.3-2.2-.5l-.3 1.6c.6.3 1.6.5 2.5.5 2-.1 3.2-1 3.2-2.7zm5.5-5.9h-1.7c-.5 0-.9.3-1.1.8l-3.2 7.6h1.9l.4-1.1h2.3l.2 1.1h1.7l-1.5-8.4zm-1.8 5.7l.8-2.2.4 2.2h-1.2zM4.7 0.2H0.1L0 0.5c3.6.9 6 3.1 7 5.8l-1-5.1C5.8.6 5.3.3 4.7.2z" fill="#1A1F71" />
    <path d="M7 5.8L6 0.7c-.1-.5-.5-.5-1-.5H0.1L0 0.4c3.6.9 6 3.1 7 5.8z" fill="#F7B600" />
  </svg>
);

const MastercardLogo = () => (
  <svg width="24" height="15" viewBox="0 0 24 15" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B" />
    <circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B" opacity="0.85" />
    <path d="M12 11.5a4.5 4.5 0 010-8 4.5 4.5 0 010 8z" fill="#FF5F00" />
  </svg>
);

const RuPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', fontStyle: 'italic', fontWeight: 900, letterSpacing: '-0.3px', flexShrink: 0 }}>
    <span style={{ color: '#0B4797', fontSize: '0.85rem' }}>Ru</span>
    <span style={{ color: '#E47911', fontSize: '0.85rem' }}>Pay</span>
    <div style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '2px' }}>
      <div style={{ width: '7px', height: '2px', background: '#E47911', transform: 'skewX(-20deg)', marginBottom: '1px' }}></div>
      <div style={{ width: '9px', height: '2px', background: '#0B4797', transform: 'skewX(-20deg)' }}></div>
    </div>
  </div>
);

const SBILogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill="#00b5ec" />
    <circle cx="12" cy="12" r="4" fill="white" />
    <rect x="11" y="15" width="2" height="7" fill="white" />
  </svg>
);

const HDFCLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', background: '#003366', padding: '1px 3px', borderRadius: '2px', flexShrink: 0, height: '14px' }}>
    <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.3px', fontFamily: 'sans-serif' }}>HDFC</span>
  </div>
);

const ICICILogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', fontStyle: 'italic', fontWeight: 900, letterSpacing: '-0.5px', flexShrink: 0 }}>
    <span style={{ color: '#9d2235', fontSize: '0.8rem' }}>I</span>
    <span style={{ color: '#ff9900', fontSize: '0.8rem' }}>CICI</span>
  </div>
);

const AxisLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 19h7l3-6 3 6h7L12 2z" fill="#861f41" />
    </svg>
    <span style={{ color: '#861f41', fontSize: '0.65rem', fontWeight: 900, fontFamily: 'sans-serif' }}>AXIS</span>
  </div>
);

const SimplLogo = () => (
  <span style={{ color: '#00d09c', fontWeight: 900, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px', flexShrink: 0 }}>simpl</span>
);

const LazyPayLogo = () => (
  <span style={{ color: '#6839f5', fontWeight: 900, fontSize: '0.85rem', fontStyle: 'italic', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px', flexShrink: 0 }}>
    lazy<span style={{ color: '#f79e1b' }}>pay</span>
  </span>
);

const sectionHeaderStyle = (isSelected) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '14px 16px',
  cursor: 'pointer',
  background: isSelected ? '#f8fafc' : 'white',
  transition: 'all 0.2s ease',
  borderBottom: isSelected ? '1px solid #f1f5f9' : 'none'
});

export default function CheckoutFlow({ isOpen, onClose, cartItems, cartTotal, cartSellerId, onCheckoutComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // Default to UPI for Zomato feel
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment states
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  
  // Custom states for Zomato-style payment page
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (step !== 3 || !isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, isOpen]);

  useEffect(() => {
    if (step === 3) {
      setTimeLeft(600);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handleCardNoChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formattedVal = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedVal += ' ';
      }
      formattedVal += val[i];
    }
    setCardNo(formattedVal);
  };

  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSearchQuery, setCouponSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && step === 2) {
      fetchActiveCoupons();
    }
  }, [isOpen, step]);

  const fetchActiveCoupons = async () => {
    try {
      const currentDomain = cartItems[0]?.domain || 'food';
      const data = await couponService.getActiveCoupons(currentDomain);
      setAvailableCoupons(data.coupons || []);
    } catch (err) {
      console.error("Failed to load active coupons", err);
    }
  };

  // Address Selector & Addition States
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Using GPS");
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Form fields for new address
  const [newHouseNo, setNewHouseNo] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newAddressType, setNewAddressType] = useState('Home');

  // Map Selector States
  const [showMapScreen, setShowMapScreen] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.9388, 77.0182]); // Default: Malumichampatti, Coimbatore
  const [mapPosition, setMapPosition] = useState([10.9388, 77.0182]);
  const [mapAddress, setMapAddress] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const handleMapSearch = (val) => {
    setMapSearchQuery(val);
  };

  const handleSelectMapSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setMapPosition([lat, lon]);
      setMapCenter([lat, lon]);
      setMapAddress(item.display_name);
      setMapSuggestions([]);
      setMapSearchQuery(item.display_name);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setMapAddress(data.display_name);
          return;
        }
      }
      setMapAddress(`Location at ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      setMapAddress(`Location at ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleConfirmMapLocation = () => {
    if (!mapAddress.trim()) {
      alert("No location resolved yet. Please click on the map to pin a location.");
      return;
    }
    const newId = `map-${Date.now()}`;
    const newAddr = { id: newId, type: 'Map Location', detail: mapAddress, icon: 'MapPin' };
    setSavedAddresses(prev => [newAddr, ...prev]);
    setSelectedAddressId(newId);
    setAddress(mapAddress);
    
    // Reset and return
    setShowMapScreen(false);
    setMapSearchQuery('');
    setMapSuggestions([]);
  };

  // Helper component to handle Leaflet Map Events inside MapContainer
  const MapEventsHandler = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMapPosition([lat, lng]);
        reverseGeocode(lat, lng);
      }
    });

    useEffect(() => {
      if (mapCenter) {
        map.setView(mapCenter, 15);
      }
    }, [mapCenter, map]);

    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 400);
      return () => clearTimeout(timer);
    }, [map]);

    return null;
  };

  const handleMainSearch = (val) => {
    setSearchQuery(val);
  };

  const handleSelectMainSuggestion = (item) => {
    const newId = `search-${Date.now()}`;
    const newAddr = { id: newId, type: 'Selected Location', detail: item.display_name, icon: 'MapPin' };
    setSavedAddresses(prev => [newAddr, ...prev]);
    setSelectedAddressId(newId);
    setAddress(item.display_name);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  // Resolve default location address immediately when map is opened
  useEffect(() => {
    if (showMapScreen) {
      reverseGeocode(mapPosition[0], mapPosition[1]);
    }
  }, [showMapScreen]);

  // Debounced API Search for Main Location Input
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions(data || []);
        }
      } catch (err) {
        console.error("Main geocoding search failed", err);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounced API Search for Map Search Input
  useEffect(() => {
    if (mapSearchQuery.trim().length < 3) {
      setMapSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=in&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setMapSuggestions(data || []);
        }
      } catch (err) {
        console.error("Map geocoding search failed", err);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  const handleGetCurrentLocation = () => {
    setLocationStatus("Locating...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus("Location Found!");
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const gpsAddress = `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)}), Malumichampatti, Coimbatore`;
          const newId = `gps-${Date.now()}`;
          const newAddr = { id: newId, type: 'Current Location', detail: gpsAddress, icon: 'MapPin' };
          setSavedAddresses(prev => [newAddr, ...prev.filter(a => a.type !== 'Current Location')]);
          setSelectedAddressId(newId);
          setAddress(gpsAddress);
        },
        () => {
          setLocationStatus("Access Denied");
        }
      );
    } else {
      setLocationStatus("Not supported");
    }
  };

  const handleSaveAddress = () => {
    if (!newHouseNo.trim() || !newArea.trim() || !newPincode.trim()) {
      alert("Please fill in all the fields.");
      return;
    }
    const fullAddress = `${newHouseNo.trim()}, ${newArea.trim()} - ${newPincode.trim()}`;
    const newId = `custom-${Date.now()}`;
    const newAddr = { id: newId, type: newAddressType, detail: fullAddress, icon: newAddressType };
    setSavedAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newId);
    setAddress(fullAddress);
    
    // Clear inputs
    setNewHouseNo('');
    setNewArea('');
    setNewPincode('');
    setNewAddressType('Home');
    
    setShowAddScreen(false);
  };
  
  if (!isOpen) return null;

  const handleApplyCoupon = (codeToApply) => {
    const codeStr = (codeToApply || couponCode).trim().toUpperCase();
    if (!codeStr) {
      alert("Please enter or select a coupon code.");
      return;
    }
    
    const coupon = availableCoupons.find(c => c.code === codeStr);
    if (!coupon) {
      alert(`Invalid or expired coupon code: ${codeStr}`);
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }

    if (cartTotal < coupon.min_order_amount) {
      alert(`This coupon requires a minimum order amount of ₹${coupon.min_order_amount}. Your cart subtotal is ₹${cartTotal.toFixed(2)}.`);
      return;
    }

    let disc = 0;
    if (coupon.discount_type === 'percentage') {
      disc = cartTotal * (coupon.discount_value / 100);
      if (coupon.max_discount > 0 && disc > coupon.max_discount) {
        disc = coupon.max_discount;
      }
    } else {
      disc = coupon.discount_value;
    }

    disc = Math.min(disc, cartTotal);

    setDiscount(disc);
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setShowCouponDrawer(false);
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const discountedTotal = Math.max(0, cartTotal - discount);
  
  const calculateCartGst = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    const discountRatio = cartTotal > 0 ? (discount / cartTotal) : 0;
    let totalGst = 0;
    cartItems.forEach(item => {
      const itemPrice = parseFloat(item.price || 0);
      const itemQty = parseInt(item.quantity || 0, 10);
      const lineTotal = itemPrice * itemQty;
      const discountedLineTotal = lineTotal * (1 - discountRatio);
      
      const classification = item.gst_classification || 'goods_5';
      const rate = classification === 'services_18' ? 0.18 : 0.05;
      
      totalGst += discountedLineTotal * rate;
    });
    return totalGst;
  };
  
  const gstAmount = calculateCartGst();
  const platformFee = 5.00;
  const packagingFee = 15.00;
  const deliveryFee = 25.00;
  const finalTotal = discountedTotal + gstAmount + platformFee + packagingFee + deliveryFee;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (paymentMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        return alert("Please enter a valid UPI ID (e.g., name@okhdfcbank).");
      }
    }
    
    if (paymentMethod === 'Credit / Debit Card') {
      if (cardNo.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3 || !cardName.trim()) {
        return alert("Please complete all credit/debit card details.");
      }
    }

    setIsProcessing(true);
    try {
      await orderService.placeOrder({
        seller_id: cartSellerId,
        domain: cartItems[0]?.domain || 'food',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          gst_classification: item.gst_classification || 'goods_5'
        })),
        total_amount: finalTotal,
        gst_amount: gstAmount,
        address,
        payment_method: paymentMethod === 'UPI' ? `UPI (${selectedUpiApp}: ${upiId})` : 
                        paymentMethod === 'Net Banking' ? `Net Banking (${selectedBank})` : 
                        paymentMethod === 'Wallet' ? `Wallet (${selectedWallet} Wallet)` : 
                        paymentMethod === 'Pay Later' ? `Pay Later (Simpl)` : 
                        paymentMethod,
        discount: discount,
        delivery_charges: deliveryFee,
        packaging_charges: packagingFee,
        platform_fee: platformFee
      });
      onCheckoutComplete();
    } catch (error) {
      alert("Failed to place order: " + (error.response?.data?.error || error.message));
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#e5e7eb', zIndex: 0 }} />
      {[ 
        { num: 1, icon: <FiMapPin />, label: 'Address' },
        { num: 2, icon: <FiFileText />, label: 'Summary' },
        { num: 3, icon: <FiCreditCard />, label: 'Payment' }
      ].map(s => (
        <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, background: 'white', padding: '0 8px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: step >= s.num ? '#10b981' : '#f3f4f6', color: step >= s.num ? 'white' : '#6b7280',
            border: step >= s.num ? 'none' : '1px solid #d1d5db', transition: 'all 0.3s'
          }}>
            {s.icon}
          </div>
          <span style={{ fontSize: '0.75rem', marginTop: '4px', color: step >= s.num ? '#10b981' : '#6b7280', fontWeight: step >= s.num ? 'bold' : 'normal' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex',
      justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: 'white', width: '100%', maxWidth: '500px', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Secure Checkout</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><FiX size={24} /></button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {renderStepIndicator()}

          {step === 1 && (
            <div>
              {showMapScreen ? (
                /* Map Selection Screen */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setShowMapScreen(false)} 
                      style={{ marginRight: '12px', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', border: 'none', background: 'none' }}
                    >
                      <FiArrowLeft size={20} />
                    </button>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#374151', fontWeight: 600 }}>Select Location on Map</h3>
                  </div>

                  {/* Search box overlaying map */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <FiSearch style={{ position: 'absolute', left: '14px', top: '14px', color: '#9ca3af' }} size={20} />
                    <input 
                      type="text" 
                      placeholder="Search for area or place name..." 
                      value={mapSearchQuery}
                      onChange={e => handleMapSearch(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px 12px 12px 44px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '10px', 
                        fontSize: '0.95rem',
                        outline: 'none',
                        background: 'white',
                        color: '#111827'
                      }}
                    />
                    
                    {/* Floating suggestions dropdown */}
                    {mapSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', zIndex: 1000,
                        marginTop: '4px', maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {mapSuggestions.map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSelectMapSuggestion(item)}
                            style={{ 
                              padding: '12px 16px', 
                              borderBottom: idx < mapSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none', 
                              cursor: 'pointer', 
                              fontSize: '0.85rem', 
                              color: '#374151', 
                              textAlign: 'left',
                              lineHeight: '1.4'
                            }}
                          >
                            <strong>{item.display_name.split(',')[0]}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leaflet Satellite Map Container */}
                  <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d1d5db', position: 'relative', zIndex: 1 }}>
                    <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>'
                        url="https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=2yDvNgaxDZSdSx2ThtS9WgRJdlgnkmfaGbhhiSzc"
                      />
                      <MapEventsHandler />
                      <Marker position={mapPosition} />
                    </MapContainer>
                  </div>

                  {/* Geocoded Address Panel & Confirmation */}
                  <div style={{ marginTop: '16px', background: '#f9fafb', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Selected Address
                    </span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', fontWeight: 500, minHeight: '36px', lineHeight: '1.4' }}>
                      {isReverseGeocoding ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }}></span>
                          Resolving location address...
                        </span>
                      ) : mapAddress || "Click on the map or search to select your location."}
                    </p>
                  </div>

                  <button 
                    onClick={handleConfirmMapLocation}
                    disabled={isReverseGeocoding || !mapAddress}
                    style={{ 
                      marginTop: '16px', 
                      width: '100%', 
                      padding: '14px', 
                      background: isReverseGeocoding || !mapAddress ? '#d1d5db' : '#10b981', 
                      color: 'white', 
                      fontWeight: 'bold', 
                      borderRadius: '10px', 
                      cursor: isReverseGeocoding || !mapAddress ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                      textAlign: 'center',
                      border: 'none'
                    }}
                  >
                    Confirm Location
                  </button>
                </div>
              ) : showAddScreen ? (
                /* Add New Address Form */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setShowAddScreen(false)} 
                      style={{ marginRight: '12px', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', border: 'none', background: 'none' }}
                    >
                      <FiArrowLeft size={20} />
                    </button>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#374151', fontWeight: 600 }}>Add New Address</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', display: 'block' }}>House/Flat No.</label>
                      <input 
                        type="text" 
                        value={newHouseNo}
                        onChange={e => setNewHouseNo(e.target.value)}
                        placeholder="e.g. 402, Sunshine Apartments"
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          fontSize: '0.95rem',
                          outline: 'none',
                          background: 'white',
                          color: '#111827'
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', display: 'block' }}>Area/Street</label>
                      <input 
                        type="text" 
                        value={newArea}
                        onChange={e => setNewArea(e.target.value)}
                        placeholder="e.g. Green Avenue, Malumichampatti"
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          fontSize: '0.95rem',
                          outline: 'none',
                          background: 'white',
                          color: '#111827'
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', display: 'block' }}>Pincode</label>
                      <input 
                        type="text" 
                        value={newPincode}
                        onChange={e => setNewPincode(e.target.value)}
                        placeholder="6 digits pincode"
                        maxLength={6}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          fontSize: '0.95rem',
                          outline: 'none',
                          background: 'white',
                          color: '#111827'
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Address Type</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {['Home', 'Work', 'Other'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewAddressType(type)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '6px',
                              border: newAddressType === type ? '1px solid #10b981' : '1px solid #d1d5db',
                              background: newAddressType === type ? '#ecfdf5' : 'white',
                              color: newAddressType === type ? '#065f46' : '#4b5563',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowAddScreen(false)}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          color: '#4b5563', 
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'white'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleSaveAddress}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
                          background: '#10b981', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '8px', 
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Save Address
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Selection Screen */
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#374151', fontWeight: 600 }}>Select Delivery Location</h3>
                  
                  {/* Search Bar */}
                  <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <FiSearch style={{ position: 'absolute', left: '14px', top: '14px', color: '#9ca3af' }} size={20} />
                    <input 
                      type="text" 
                      placeholder="Search for area or place name..." 
                      value={searchQuery}
                      onChange={e => handleMainSearch(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px 12px 12px 44px', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '10px', 
                        background: '#f9fafb', 
                        outline: 'none',
                        fontSize: '0.95rem',
                        color: '#111827'
                      }}
                    />
                    
                    {/* Search Suggestions dropdown */}
                    {searchSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', zIndex: 10,
                        marginTop: '4px', maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {searchSuggestions.map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSelectMainSuggestion(item)}
                            style={{ 
                              padding: '12px 16px', 
                              borderBottom: idx < searchSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none', 
                              cursor: 'pointer', 
                              fontSize: '0.85rem', 
                              color: '#374151', 
                              textAlign: 'left',
                              lineHeight: '1.4'
                            }}
                          >
                            <strong>{item.display_name.split(',')[0]}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Use Current Location Button */}
                  <button 
                    onClick={handleGetCurrentLocation}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      padding: '14px', 
                      border: '1px solid #d1fae5', 
                      background: '#ecfdf5', 
                      borderRadius: '10px', 
                      marginBottom: '12px', 
                      textAlign: 'left',
                      color: '#065f46',
                      cursor: 'pointer'
                    }}
                  >
                    <FiMapPin style={{ marginRight: '12px', flexShrink: 0 }} size={20} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Use Current Location</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{locationStatus}</span>
                    </div>
                  </button>

                  {/* Select Location on Map Button */}
                  <button 
                    onClick={() => {
                      setShowMapScreen(true);
                      // Trigger current location if possible to initialize map center nicely
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lon = pos.coords.longitude;
                            setMapPosition([lat, lon]);
                            setMapCenter([lat, lon]);
                            reverseGeocode(lat, lon);
                          },
                          () => {
                            reverseGeocode(mapPosition[0], mapPosition[1]);
                          }
                        );
                      } else {
                        reverseGeocode(mapPosition[0], mapPosition[1]);
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      padding: '14px', 
                      border: '1px solid #e5e7eb', 
                      background: 'white', 
                      borderRadius: '10px', 
                      marginBottom: '20px', 
                      textAlign: 'left',
                      color: '#374151',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <FiMapPin style={{ marginRight: '12px', flexShrink: 0, color: '#10b981' }} size={20} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select Location on Map</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pin location via Satellite Map</span>
                    </div>
                  </button>

                  {/* Saved Addresses Header */}
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Saved Addresses</h4>
                  
                  {/* Saved Addresses List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {savedAddresses.length > 0 ? (
                      savedAddresses.map(addr => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div 
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setAddress(addr.detail);
                            }}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              padding: '14px', 
                              border: isSelected ? '1px solid #10b981' : '1px solid #e5e7eb', 
                              background: isSelected ? '#f0fdf4' : 'white', 
                              borderRadius: '10px', 
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ marginRight: '14px', color: isSelected ? '#10b981' : '#9ca3af', marginTop: '3px' }}>
                              {addr.icon === 'Home' ? <FiHome size={20} /> : addr.icon === 'Briefcase' ? <FiBriefcase size={20} /> : <FiMapPin size={20} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isSelected ? '#166534' : '#1f2937' }}>{addr.type}</span>
                              <span style={{ fontSize: '0.85rem', color: isSelected ? '#14532d' : '#4b5563', marginTop: '2px' }}>{addr.detail}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '16px', border: '1px dashed #d1d5db', borderRadius: '10px', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>
                        No saved addresses found. Please add a new address to continue.
                      </div>
                    )}
                  </div>

                  {/* Add New Address Button */}
                  <button 
                    onClick={() => setShowAddScreen(true)}
                    style={{ 
                      marginTop: '24px', 
                      width: '100%', 
                      padding: '14px', 
                      background: '#10b981', 
                      color: 'white', 
                      fontWeight: 'bold', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <FiPlus size={20} /> Add New Address
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#374151' }}>Order Summary</h3>
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                {cartItems.map(item => (
                  <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                    <span>{item.quantity} x {item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4b5563' }}>
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                
                {/* Coupon Selection Panel (Zomato-style) */}
                <div style={{ marginBottom: '16px', marginTop: '12px', textAlign: 'left' }}>
                  {!appliedCoupon ? (
                    <div 
                      onClick={() => setShowCouponDrawer(true)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', 
                        background: '#fcf2f2', border: '1px dashed #ec4899', borderRadius: '10px', 
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fce7e7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fcf2f2'}
                    >
                      <FiTag size={18} style={{ color: '#db2777' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Apply Coupon / Select Offers</span>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Save more with active discount promo codes</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#db2777' }}>VIEW</span>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', 
                      background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '10px'
                    }}>
                      <FiTag size={18} style={{ color: '#059669' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>{appliedCoupon.code} APPLIED</span>
                        <span style={{ fontSize: '0.7rem', color: '#065f46' }}>Saved ₹{discount.toFixed(2)} on this order!</span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        REMOVE
                      </button>
                    </div>
                  )}
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#059669', fontWeight: 600 }}>
                    <span>Discount Applied</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4b5563' }}>
                  <span>Delivery Partner Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4b5563' }}>
                  <span>Packaging Charges</span>
                  <span>₹{packagingFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4b5563' }}>
                  <span>Platform Fee</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4b5563' }}>
                  <span>Tax (GST)</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>
                  <span>Total Payable</span>
                  <span style={{ color: '#10b981' }}>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'left', fontFamily: 'Outfit, sans-serif' }}>
              <style>{`
                @keyframes blink {
                  0% { opacity: 0.4; }
                  50% { opacity: 1; }
                  100% { opacity: 0.4; }
                }
                @keyframes pulse {
                  0% { transform: scale(0.96); opacity: 0.6; }
                  50% { transform: scale(1.04); opacity: 1; }
                  100% { transform: scale(0.96); opacity: 0.6; }
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideLeft {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
                .nb-grid-item {
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  padding: 12px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  cursor: pointer;
                  background: #f8fafc;
                  transition: all 0.2s ease;
                  min-height: 65px;
                }
                .nb-grid-item:hover {
                  border-color: #cbd5e1;
                  background: #f1f5f9;
                }
                .nb-grid-item.selected {
                  border-color: #10b981;
                  background: #ecfdf5;
                  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.05);
                }
                .pay-option-card {
                  border: 1px solid #f1f5f9;
                  border-radius: 12px;
                  background: white;
                  margin-bottom: 12px;
                  transition: all 0.25s ease;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .pay-option-card.active {
                  border-color: #10b981;
                  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.06);
                }
                .recommended-upi-btn {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 6px;
                  padding: 12px 8px;
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  background: white;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                .recommended-upi-btn:hover {
                  background: #f8fafc;
                  border-color: #cbd5e1;
                }
                .recommended-upi-btn.selected {
                  border-color: #10b981;
                  background: #f0fdf4;
                  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.05);
                }
              `}</style>

              {/* Zomato-style payment header */}
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                border: '1px solid #ffe4e6'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paying FreshKart</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48', fontFamily: 'Outfit, sans-serif' }}>₹{finalTotal.toFixed(2)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'white', 
                  padding: '6px 12px', 
                  borderRadius: '20px',
                  boxShadow: '0 2px 5px rgba(225, 29, 72, 0.05)',
                  border: '1px solid #ffe4e6'
                }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48', animation: 'pulse 1.5s infinite' }}></span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e11d48', fontFamily: 'monospace' }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Recommended UPI Quick Pay */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Recommended UPI</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { name: 'Google Pay', component: <GooglePayLogo />, suffix: '@okaxis' },
                    { name: 'PhonePe', component: <PhonePeLogo />, suffix: '@ybl' },
                    { name: 'Paytm', component: <PaytmLogo />, suffix: '@paytm' },
                    { name: 'Amazon Pay', component: <AmazonPayLogo />, suffix: '@apl' }
                  ].map(app => {
                    const isSelected = paymentMethod === 'UPI' && selectedUpiApp === app.name;
                    return (
                      <button
                        key={app.name}
                        type="button"
                        className={`recommended-upi-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setPaymentMethod('UPI');
                          setSelectedUpiApp(app.name);
                          const username = user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'buyer';
                          setUpiId(`${username}${app.suffix}`);
                        }}
                      >
                        <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {app.component}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600 }}>Quick Pay</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods Accordion */}
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>All Payment Options</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                
                {/* UPI Section */}
                <div className={`pay-option-card ${paymentMethod === 'UPI' ? 'active' : ''}`}>
                  <div 
                    onClick={() => {
                      setPaymentMethod('UPI');
                      if (!upiId) {
                        const username = user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'buyer';
                        setUpiId(`${username}@okaxis`);
                      }
                    }} 
                    style={sectionHeaderStyle(paymentMethod === 'UPI')}
                  >
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', background: '#eff6ff', borderRadius: '50%', color: '#3b82f6' }}>
                      <FiSmartphone size={14} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>UPI (Google Pay, PhonePe, Paytm)</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pay instantly using any UPI App</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'UPI' ? '5px solid #10b981' : '2px solid #d1d5db',
                      background: 'white', transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div style={{ padding: '16px 20px 20px 52px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Enter UPI ID *</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. name@okhdfcbank" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '10px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid #d1d5db', 
                              fontSize: '0.9rem',
                              outline: 'none',
                              color: '#1f2937',
                              background: 'white'
                            }} 
                          />
                          {upiId.includes('@') && (
                            <span style={{ position: 'absolute', right: '12px', top: '11px', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>✓ Verified</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Your UPI ID will be verified before payment completes.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit / Debit Cards Section */}
                <div className={`pay-option-card ${paymentMethod === 'Credit / Debit Card' ? 'active' : ''}`}>
                  <div 
                    onClick={() => setPaymentMethod('Credit / Debit Card')} 
                    style={sectionHeaderStyle(paymentMethod === 'Credit / Debit Card')}
                  >
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', background: '#ecfdf5', borderRadius: '50%', color: '#10b981' }}>
                      <FiCreditCard size={14} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Credit / Debit Card</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Visa, Mastercard, RuPay, Diner's</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'Credit / Debit Card' ? '5px solid #10b981' : '2px solid #d1d5db',
                      background: 'white', transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </div>

                  {paymentMethod === 'Credit / Debit Card' && (
                    <div style={{ padding: '16px 20px 20px 52px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9' }}>
                      {/* Premium Mini-Credit Card Mockup */}
                      <div style={{
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        borderRadius: '12px',
                        padding: '16px',
                        color: 'white',
                        marginBottom: '16px',
                        boxShadow: '0 8px 20px rgba(15,23,42,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '140px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                          <div style={{
                            width: '32px', height: '24px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            borderRadius: '4px', opacity: 0.85
                          }} />
                          <div style={{ display: 'flex', alignItems: 'center', height: '18px', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px' }}>
                            {cardNo.startsWith('4') ? <VisaLogo /> : cardNo.startsWith('5') ? <MastercardLogo /> : cardNo.startsWith('6') ? <RuPayLogo /> : <span style={{ color: '#1e293b', fontSize: '0.6rem', fontWeight: 800 }}>CARD</span>}
                          </div>
                        </div>

                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '1.25rem',
                          letterSpacing: '2.5px',
                          color: '#f8fafc',
                          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                          margin: '8px 0',
                          zIndex: 1
                        }}>
                          {cardNo || '•••• •••• •••• ••••'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.85, zIndex: 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: '#94a3b8' }}>Card Holder</span>
                            <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{cardName ? cardName.toUpperCase() : 'YOUR NAME'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: '#94a3b8' }}>Expires</span>
                            <span style={{ fontWeight: 700 }}>{cardExpiry || 'MM/YY'}</span>
                          </div>
                        </div>

                        <div style={{
                          position: 'absolute', right: '-30px', bottom: '-30px', width: '110px', height: '110px',
                          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', zIndex: 0
                        }} />
                      </div>

                      {/* Card Input Fields */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Card Number *</label>
                          <input 
                            type="text" 
                            placeholder="4000 1234 5678 9010" 
                            maxLength="19" 
                            value={cardNo}
                            onChange={handleCardNoChange}
                            style={{ 
                              width: '100%', 
                              padding: '10px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid #d1d5db', 
                              fontSize: '0.9rem',
                              background: 'white',
                              color: '#1f2937',
                              outline: 'none'
                            }} 
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Expiry (MM/YY) *</label>
                            <input 
                              type="text" 
                              placeholder="MM/YY" 
                              maxLength="5" 
                              value={cardExpiry}
                              onChange={handleCardExpiryChange}
                              style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                borderRadius: '8px', 
                                border: '1px solid #d1d5db', 
                                fontSize: '0.9rem',
                                background: 'white',
                                color: '#1f2937',
                                outline: 'none'
                              }} 
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px', textAlign: 'left' }}>CVV *</label>
                            <input 
                              type="password" 
                              placeholder="CVV" 
                              maxLength="3" 
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                borderRadius: '8px', 
                                border: '1px solid #d1d5db', 
                                fontSize: '0.9rem',
                                background: 'white',
                                color: '#1f2937',
                                outline: 'none'
                              }} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Name on Card *</label>
                          <input 
                            type="text" 
                            placeholder="Name on Card" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '10px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid #d1d5db', 
                              fontSize: '0.9rem',
                              background: 'white',
                              color: '#1f2937',
                              outline: 'none'
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Banking Section */}
                <div className={`pay-option-card ${paymentMethod === 'Net Banking' ? 'active' : ''}`}>
                  <div 
                    onClick={() => setPaymentMethod('Net Banking')} 
                    style={sectionHeaderStyle(paymentMethod === 'Net Banking')}
                  >
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', background: '#fdf2f8', borderRadius: '50%', color: '#db2777' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Net Banking</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pay via direct transfer from popular banks</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'Net Banking' ? '5px solid #10b981' : '2px solid #d1d5db',
                      background: 'white', transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </div>

                  {paymentMethod === 'Net Banking' && (
                    <div style={{ padding: '16px 20px 20px 52px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9' }}>
                      {/* Popular Banks 2x2 Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                        {[
                          { id: 'SBI', logo: <SBILogo />, label: 'State Bank of India' },
                          { id: 'HDFC', logo: <HDFCLogo />, label: 'HDFC Bank' },
                          { id: 'ICICI', logo: <ICICILogo />, label: 'ICICI Bank' },
                          { id: 'Axis', logo: <AxisLogo />, label: 'Axis Bank' }
                        ].map(bank => {
                          const isSelected = selectedBank === bank.id;
                          return (
                            <div
                              key={bank.id}
                              className={`nb-grid-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedBank(bank.id)}
                            >
                              <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {bank.logo}
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563' }}>{bank.id}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dropdown for other banks */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textAlign: 'left' }}>Or Choose Other Bank</label>
                        <select 
                          value={['SBI', 'HDFC', 'ICICI', 'Axis'].includes(selectedBank) ? '' : selectedBank} 
                          onChange={(e) => setSelectedBank(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            background: 'white',
                            outline: 'none',
                            cursor: 'pointer',
                            color: '#1f2937'
                          }}
                        >
                          <option value="" disabled>Select bank...</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                          <option value="Yes Bank">Yes Bank</option>
                          <option value="Punjab National Bank">Punjab National Bank</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                          <option value="Union Bank of India">Union Bank of India</option>
                          <option value="IndusInd Bank">IndusInd Bank</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallets & Pay Later Section */}
                <div className={`pay-option-card ${(paymentMethod === 'Wallet' || paymentMethod === 'Pay Later') ? 'active' : ''}`}>
                  <div 
                    onClick={() => {
                      setPaymentMethod('Wallet');
                      setSelectedWallet('Paytm');
                    }} 
                    style={sectionHeaderStyle(paymentMethod === 'Wallet' || paymentMethod === 'Pay Later')}
                  >
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', background: '#fffbeb', borderRadius: '50%', color: '#d97706' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 0 0 4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path></svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Wallets & Pay Later</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Paytm Wallet, Amazon Pay, Simpl, LazyPay</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: (paymentMethod === 'Wallet' || paymentMethod === 'Pay Later') ? '5px solid #10b981' : '2px solid #d1d5db',
                      background: 'white', transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </div>

                  {(paymentMethod === 'Wallet' || paymentMethod === 'Pay Later') && (
                    <div style={{ padding: '16px 20px 20px 52px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Wallets */}
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', textAlign: 'left' }}>Wallets</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                              { id: 'Paytm', logo: <PaytmLogo />, desc: 'Link and pay using Paytm' },
                              { id: 'PhonePe', logo: <PhonePeLogo />, desc: 'Pay using PhonePe wallet' },
                              { id: 'Amazon Pay', logo: <AmazonPayLogo />, desc: 'Instant checkout via Amazon' }
                            ].map(wallet => {
                              const isSelected = paymentMethod === 'Wallet' && selectedWallet === wallet.id;
                              return (
                                <div
                                  key={wallet.id}
                                  onClick={() => {
                                    setPaymentMethod('Wallet');
                                    setSelectedWallet(wallet.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: isSelected ? '#f0fdf4' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ height: '18px', display: 'flex', alignItems: 'center' }}>
                                      {wallet.logo}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{wallet.desc}</span>
                                  </div>
                                  <div style={{
                                    width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '4px solid #10b981' : '1.5px solid #d1d5db',
                                    background: 'white'
                                  }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pay Later */}
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', textAlign: 'left' }}>Pay Later</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                              { id: 'Simpl', logo: <SimplLogo />, desc: 'Pay in 15 days. No OTP required.' },
                              { id: 'LazyPay', logo: <LazyPayLogo />, desc: 'Buy now, pay next month.' }
                            ].map(pl => {
                              const isSelected = paymentMethod === 'Pay Later' && selectedWallet === pl.id;
                              return (
                                <div
                                  key={pl.id}
                                  onClick={() => {
                                    setPaymentMethod('Pay Later');
                                    setSelectedWallet(pl.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: isSelected ? '#f0fdf4' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ height: '18px', display: 'flex', alignItems: 'center' }}>
                                      {pl.logo}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pl.desc}</span>
                                  </div>
                                  <div style={{
                                    width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '4px solid #10b981' : '1.5px solid #d1d5db',
                                    background: 'white'
                                  }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery Section */}
                <div className={`pay-option-card ${paymentMethod === 'Cash on Delivery' ? 'active' : ''}`}>
                  <div 
                    onClick={() => setPaymentMethod('Cash on Delivery')} 
                    style={sectionHeaderStyle(paymentMethod === 'Cash on Delivery')}
                  >
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', background: '#f0fdf4', borderRadius: '50%', color: '#16a34a' }}>
                      <span style={{ fontSize: '0.95rem' }}>💵</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Cash / QR on Delivery (COD)</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pay cash or scan QR code at doorstep</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'Cash on Delivery' ? '5px solid #10b981' : '2px solid #d1d5db',
                      background: 'white', transition: 'all 0.2s', flexShrink: 0
                    }} />
                  </div>

                  {paymentMethod === 'Cash on Delivery' && (
                    <div style={{ padding: '14px 20px 16px 52px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9', color: '#4b5563', fontSize: '0.8rem', textAlign: 'left', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#16a34a', fontSize: '1rem', marginTop: '2px' }}>✓</span>
                        <span>Please keep exact change ready or ask the delivery partner to show the UPI QR Code on their app when they arrive.</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {((!showAddScreen && !showMapScreen) || step !== 1) && (
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid #e5e7eb', 
            background: 'white',
            boxShadow: step === 3 ? '0 -4px 12px rgba(0,0,0,0.03)' : 'none',
            zIndex: 10
          }}>
            {step === 3 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Security trust badge */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>100% Safe Payments | PCI-DSS Compliant Security</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Payable</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', fontFamily: 'Outfit, sans-serif' }}>₹{finalTotal.toFixed(2)}</span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Discount of ₹{discount.toFixed(2)} applied</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                    <button 
                      type="button"
                      onClick={handleBack} 
                      disabled={isProcessing} 
                      style={{ 
                        padding: '12px 18px', 
                        background: 'white', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '10px', 
                        color: '#4b5563', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={handleSubmit} 
                      disabled={isProcessing || (paymentMethod === 'UPI' && (!upiId.trim() || !upiId.includes('@')))} 
                      style={{ 
                        padding: '12px 24px', 
                        background: '#10b981', 
                        border: 'none', 
                        borderRadius: '10px', 
                        color: 'white', 
                        fontWeight: 700, 
                        fontSize: '0.95rem',
                        cursor: isProcessing ? 'wait' : 'pointer', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '8px', 
                        flex: 1, 
                        maxWidth: '220px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isProcessing ? 'Processing...' : paymentMethod === 'Cash on Delivery' ? 'Place COD Order' : 'Pay Securely'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                {step > 1 ? (
                  <button type="button" onClick={handleBack} disabled={isProcessing} style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Back</button>
                ) : <div style={{ flex: 1 }} />}
                
                <button type="button" onClick={handleNext} disabled={step === 1 && !address.trim()} style={{ padding: '12px 24px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: step === 1 && !address.trim() ? 'not-allowed' : 'pointer', opacity: step === 1 && !address.trim() ? 0.5 : 1, flex: 1 }}>Next</button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Zomato-style Sliding Coupon Drawer Overlay */}
      {showCouponDrawer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 10000,
          display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', background: 'white', height: '100%',
            display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)',
            animation: 'slideLeft 0.3s ease-out', position: 'relative'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiTag size={20} style={{ color: '#db2777' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', fontFamily: 'Outfit, sans-serif' }}>Apply Coupon</h3>
              </div>
              <button 
                onClick={() => setShowCouponDrawer(false)}
                style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Manual input box inside drawer */}
            <div style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Type coupon code (e.g. SAVE20)" 
                  value={couponSearchQuery}
                  onChange={(e) => setCouponSearchQuery(e.target.value)}
                  style={{ 
                    flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', 
                    fontSize: '0.9rem', textTransform: 'uppercase', outline: 'none'
                  }}
                />
                <button 
                  onClick={() => handleApplyCoupon(couponSearchQuery)}
                  style={{ 
                    padding: '10px 20px', background: '#db2777', color: 'white', border: 'none', 
                    borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' 
                  }}
                >
                  APPLY
                </button>
              </div>
            </div>

            {/* Coupons List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Available Coupons</h4>
              
              {availableCoupons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#6b7280' }}>
                  <FiTag size={36} style={{ color: '#d1d5db', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>No active coupons available right now.</p>
                </div>
              ) : (
                availableCoupons
                  .filter(c => !couponSearchQuery || c.code.includes(couponSearchQuery.toUpperCase()))
                  .map(coupon => {
                    const isApplicable = cartTotal >= coupon.min_order_amount;
                    return (
                      <div 
                        key={coupon.coupon_id} 
                        style={{ 
                          border: '1px dashed #10b981', borderRadius: '12px', padding: '16px',
                          background: isApplicable ? '#fcfdfd' : '#fcfcfc', opacity: isApplicable ? 1 : 0.7,
                          textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', background: '#ecfdf5', color: '#047857', 
                            borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, 
                            border: '1px solid #a7f3d0', fontFamily: 'monospace' 
                          }}>
                            {coupon.code}
                          </span>
                          
                          {isApplicable ? (
                            <button 
                              onClick={() => handleApplyCoupon(coupon.code)}
                              style={{ 
                                padding: '6px 16px', background: 'none', border: 'none', 
                                color: '#db2777', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' 
                              }}
                            >
                              APPLY
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>LOCKED</span>
                          )}
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} FLAT OFF`}
                          </div>
                          {coupon.description && (
                            <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '3px' }}>
                              {coupon.description}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.7rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Min Order: ₹{coupon.min_order_amount}</span>
                          {coupon.max_discount > 0 && <span>Max Discount: ₹{coupon.max_discount}</span>}
                        </div>
                        
                        {!isApplicable && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                            Add items worth ₹{(coupon.min_order_amount - cartTotal).toFixed(2)} more to unlock!
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
