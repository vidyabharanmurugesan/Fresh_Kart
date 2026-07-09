import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft, FiMapPin, FiFileText, FiUpload } from 'react-icons/fi';
import { MdStorefront, MdDirectionsBike } from 'react-icons/md';
import { authService } from '../../services/authService';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Auth.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const roles = [
  { id: 'buyer', label: 'Buyer', emoji: '', desc: 'Order food & groceries', color: '#10b981' },
  { id: 'seller', label: 'Seller', emoji: '', desc: 'Sell your products', color: '#f59e0b' },
  { id: 'admin', label: 'Admin', emoji: '👨‍💼', desc: 'Manage the platform', color: '#3b82f6' },
  { id: 'delivery', label: 'Delivery Partner', emoji: '🛵', desc: 'Deliver orders & earn', color: '#a78bfa' },
];

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

function LocationPickerMap({ value, onChange, onAddressResolve }) {
  const [position, setPosition] = useState([12.9716, 77.5946]); // Default to Bengaluru
  const [hasPosition, setHasPosition] = useState(false);

  useEffect(() => {
    if (value) {
      const parts = value.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition([lat, lng]);
          setHasPosition(true);
        }
      }
    }
  }, [value]);

  const handleResolveAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const resolved = {
          current_address: data.display_name || '',
          city: addr.city || addr.town || addr.village || addr.suburb || '',
          state: addr.state || '',
          pin_code: addr.postcode || ''
        };
        if (onAddressResolve) {
          onAddressResolve(resolved);
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setPosition([lat, lng]);
        setHasPosition(true);
        onChange(coords);
        handleResolveAddress(lat, lng);
      }
    });
    return null;
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setPosition([latitude, longitude]);
          setHasPosition(true);
          onChange(coords);
          handleResolveAddress(latitude, longitude);
        },
        (err) => {
          console.error('Error getting location:', err);
          alert('Could not retrieve current location. Please select it manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div style={{ marginTop: '10px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            padding: '6px 12px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
           Use Current Location
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', alignSelf: 'center' }}>
          Or click on the map to pin location
        </span>
      </div>
      <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-dark-border)' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          <MapController position={position} />
          {hasPosition && <Marker position={position} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1); // 1 = role selection, 2 = form
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', shop_name: '', vehicle_number: '',
    shop_license: '', shop_license_image: '', shop_location: '', shop_type: 'food',
    shop_owner_name: '', shop_address: '', gps_location: '', aadhaar_card: '',
    pan_card: '', bank_account_details: '', shop_logo: '', shop_front_image: '',
    veg_nonveg: 'both', agree_terms: false,
    
    // Delivery fields
    profile_photo: '', aadhaar_front_image: '', aadhaar_back_image: '', pan_card_image: '',
    live_selfie_image: '', driving_license_number: '', driving_license_image: '',
    vehicle_type: 'bike', rc_book_image: '', vehicle_insurance_image: '',
    current_address: '', city: '', state: '', pin_code: '', bank_account_holder_name: '',
    bank_name: '', bank_account_number: '', bank_ifsc_code: '', preferred_delivery_area: '',
    languages_known: '', work_type: 'full-time', emergency_contact_name: 'Emergency Contacts',
    emergency_contact_phone: '', emergency_contact_relationship: '',
    
    // Declarations
    agree_info_accurate: false, agree_terms_privacy: false
  });

  const [uploadingFields, setUploadingFields] = useState({
    shop_license_image: false,
    shop_logo: false,
    shop_front_image: false,
    
    // Delivery uploads
    profile_photo: false,
    aadhaar_front_image: false,
    aadhaar_back_image: false,
    pan_card_image: false,
    live_selfie_image: false,
    driving_license_image: false,
    rc_book_image: false,
    vehicle_insurance_image: false
  });

  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState('');

  // Modals and permissions for delivery
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    storage: false,
    notifications: false
  });

  const togglePermission = (name) => {
    setPermissions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSendOtp = async () => {
    setError('');
    setLoadingOtp(true);
    
    let formattedPhone = formData.phone.replace(/[\s()-]/g, '').trim();
    if (!formattedPhone) {
      setError('Please enter a valid phone number first');
      setLoadingOtp(false);
      return;
    }
    
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        setError('Phone number must include country code (e.g. +91XXXXXXXXXX)');
        setLoadingOtp(false);
        return;
      }
    }

    try {
      const response = await authService.sendOtp(formattedPhone);
      setIsOtpSent(true);
      setError('');
      if (response.mode === 'simulation') {
        setError(`Twilio simulation mode: OTP code generated is ${response.simulated_otp}`);
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.response?.data?.error || 'Failed to send OTP. Please check your connection.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    
    setError('');
    setLoadingOtp(true);
    
    let formattedPhone = formData.phone.replace(/[\s()-]/g, '').trim();
    if (!formattedPhone.startsWith('+') && formattedPhone.length === 10) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      await authService.verifyOtp(formattedPhone, otpCode);
      setIsPhoneVerified(true);
      setFirebaseUid('twilio-verified-' + Math.random().toString(36).substring(7));
      setError('');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleImageChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    setError('');
    try {
      const response = await authService.uploadLicenseImage(file);
      setFormData(prev => ({ ...prev, [fieldName]: response.url }));
    } catch (err) {
      console.error(`${fieldName} upload error:`, err);
      setError(err.response?.data?.error || `Failed to upload image. Please try again.`);
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.phone && !isPhoneVerified) {
      setError('Please verify your phone number via OTP first.');
      setLoading(false);
      return;
    }

    if (selectedRole === 'seller') {
      if (!formData.agree_terms) {
        setError('You must agree to the Terms & Conditions.');
        setLoading(false);
        return;
      }
      const requiredUploads = ['shop_license_image', 'shop_logo', 'shop_front_image'];
      for (const field of requiredUploads) {
        if (!formData[field]) {
          setError(`Please upload the ${field.replace(/_/g, ' ')}.`);
          setLoading(false);
          return;
        }
      }
    }

    if (selectedRole === 'delivery') {
      // Validate permissions
      if (!permissions.location || !permissions.camera || !permissions.storage || !permissions.notifications) {
        setError('Please grant all required permissions before registration.');
        setLoading(false);
        return;
      }
      // Validate declarations
      if (!formData.agree_info_accurate) {
        setError('Please confirm that all information provided is accurate.');
        setLoading(false);
        return;
      }
      if (!formData.agree_terms_privacy) {
        setError('You must agree to the Terms & Conditions and Privacy Policy.');
        setLoading(false);
        return;
      }
      if (!formData.gps_location) {
        setError('Please pinpoint your current address on the map.');
        setLoading(false);
        return;
      }
      // Validate uploads
      const requiredUploads = [
        'profile_photo', 'aadhaar_front_image', 'aadhaar_back_image', 'pan_card_image',
        'live_selfie_image', 'driving_license_image', 'rc_book_image', 'vehicle_insurance_image'
      ];
      for (const field of requiredUploads) {
        if (!formData[field]) {
          setError(`Please upload: ${field.replace(/_/g, ' ')}.`);
          setLoading(false);
          return;
        }
      }
    }

    // Optional email fallback for delivery
    let emailToSubmit = formData.email;
    if (!emailToSubmit && selectedRole === 'delivery') {
      emailToSubmit = `${formData.phone.replace(/[^0-9]/g, '')}@freshkart-delivery.com`;
    }

    try {
      const payload = { 
        ...formData, 
        email: emailToSubmit,
        role: selectedRole, 
        firebase_uid: firebaseUid 
      };
      
      const response = await signup(payload);
      
      if (selectedRole === 'delivery') {
        setShowSuccessModal(true);
      } else {
        const role = response.user.role;
        const defaultPaths = {
          buyer: '/buyer/food/home',
          seller: '/seller/food/home',
          admin: '/admin/food/home',
          delivery: '/delivery/home',
        };
        navigate(defaultPaths[role] || '/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="signup-page">
      <div className="auth-bg-shapes">
        <div className="auth-shape auth-shape-1" />
        <div className="auth-shape auth-shape-2" />
      </div>

      <div className="auth-container animate-scaleIn">
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <img src="/logo.png" alt="FreshKart Logo" className="auth-logo-img" />
          </Link>
          <h1>{step === 1 ? 'Join FreshKart' : 'Create Account'}</h1>
          <p>{step === 1 ? 'Choose how you want to use FreshKart' : `Signing up as ${selectedRole}`}</p>
        </div>

        {step === 1 ? (
          <div className="role-selection" id="role-selection">
            {roles.map((role) => (
              <button
                key={role.id}
                className="role-select-card"
                onClick={() => handleRoleSelect(role.id)}
                style={{ '--role-color': role.color }}
                id={`role-${role.id}`}
              >
                <span className="role-select-emoji">{role.emoji}</span>
                <div className="role-select-info">
                  <h3>{role.label}</h3>
                  <p>{role.desc}</p>
                </div>
                <FiArrowRight className="role-arrow" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <button className="btn-back" onClick={() => setStep(1)}>
              <FiArrowLeft /> Change role
            </button>

            <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <FiUser className="input-icon" />
                <input
                  type="text" name="name" placeholder="Full Name"
                  value={formData.name} onChange={handleChange} required id="signup-name"
                />
              </div>

              <div className="input-group">
                <FiMail className="input-icon" />
                <input
                  type="email" name="email" placeholder={selectedRole === 'delivery' ? "Email address (Optional)" : "Email address"}
                  value={formData.email} onChange={handleChange} required={selectedRole !== 'delivery'} id="signup-email"
                />
              </div>

              <div className="phone-verification-wrapper">
                <div className="input-group">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number (e.g. +91XXXXXXXXXX)"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isPhoneVerified}
                    id="signup-phone"
                    required
                  />
                  {!isPhoneVerified && (
                    <button
                      type="button"
                      className="btn-send-otp"
                      onClick={handleSendOtp}
                      disabled={loadingOtp || !formData.phone}
                    >
                      {loadingOtp && !isOtpSent ? 'Sending...' : isOtpSent ? 'Resend' : 'Verify'}
                    </button>
                  )}
                </div>

                {isOtpSent && !isPhoneVerified && (
                  <div className="otp-verification-section">
                    <div className="input-group">
                      <FiLock className="input-icon" />
                      <input
                        type="text"
                        placeholder="6-digit OTP code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        disabled={loadingOtp}
                      />
                      <button
                        type="button"
                        className="btn-verify-otp"
                        onClick={handleVerifyOtp}
                        disabled={loadingOtp}
                      >
                        {loadingOtp ? 'Verifying...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}

                {isPhoneVerified && (
                  <div className="phone-verified-badge">
                    <span> Phone number verified successfully</span>
                  </div>
                )}
              </div>

              {selectedRole === 'seller' && (
                <>
                  {/* Section: Business Info */}
                  <div className="auth-section-title"> Business Info</div>
                  
                  <div className="auth-grid-2">
                    <div className="input-group">
                      <MdStorefront className="input-icon" />
                      <input
                        type="text" name="shop_name" placeholder="Shop Name"
                        value={formData.shop_name} onChange={handleChange} required id="signup-shop"
                      />
                    </div>

                    <div className="input-group">
                      <FiUser className="input-icon" />
                      <input
                        type="text" name="shop_owner_name" placeholder="Shop Owner Name"
                        value={formData.shop_owner_name} onChange={handleChange} required id="signup-owner"
                      />
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="input-group">
                      <select
                        name="shop_type"
                        value={formData.shop_type}
                        onChange={handleChange}
                        required
                        id="signup-shop-type"
                        className="auth-select"
                        style={{ paddingLeft: 'calc(var(--space-4) + 28px)' }}
                      >
                        <option value="food"> Shop Type: Food</option>
                        <option value="grocery"> Shop Type: Grocery</option>
                      </select>
                    </div>

                    {formData.shop_type === 'food' && (
                      <div className="input-group animate-fadeIn">
                        <select
                          name="veg_nonveg"
                          value={formData.veg_nonveg}
                          onChange={handleChange}
                          required
                          id="signup-veg-nonveg"
                          className="auth-select"
                          style={{ paddingLeft: 'calc(var(--space-4) + 28px)' }}
                        >
                          <option value="both"> Veg & Non-Veg (Both)</option>
                          <option value="veg"> Pure Veg</option>
                          <option value="non-veg"> Non-Veg Only</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="shop_location" placeholder="City / Locality"
                      value={formData.shop_location} onChange={handleChange} required id="signup-location"
                    />
                  </div>

                  <div className="input-group">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="shop_address" placeholder="Full Shop Address"
                      value={formData.shop_address} onChange={handleChange} required id="signup-address"
                    />
                  </div>

                  <div className="input-group">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="gps_location" placeholder="GPS Location (e.g. 12.9716, 77.5946)"
                      value={formData.gps_location} onChange={handleChange} required id="signup-gps"
                    />
                  </div>
                  <LocationPickerMap
                    value={formData.gps_location}
                    onChange={(coords) => setFormData(prev => ({ ...prev, gps_location: coords }))}
                  />

                  {/* Section: Verification Documents */}
                  <div className="auth-section-title">📄 Verification Docs</div>

                  <div className="input-group">
                    <FiFileText className="input-icon" />
                    <input
                      type="text" name="shop_license" placeholder="Business License Number"
                      value={formData.shop_license} onChange={handleChange} required id="signup-license"
                    />
                  </div>

                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="aadhaar_card" placeholder="Aadhaar Card Number"
                        value={formData.aadhaar_card} onChange={handleChange} required id="signup-aadhaar"
                        maxLength={12}
                      />
                    </div>

                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="pan_card" placeholder="PAN Card Number"
                        value={formData.pan_card} onChange={handleChange} required id="signup-pan"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Section: Branding & Banking */}
                  <div className="auth-section-title"> Branding & Banking</div>

                  <div className="input-group">
                    <FiFileText className="input-icon" />
                    <input
                      type="text" name="bank_account_details" placeholder="Bank Details (Bank, A/C No, IFSC)"
                      value={formData.bank_account_details} onChange={handleChange} required id="signup-bank"
                    />
                  </div>

                  {/* Upload Grids */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    {/* License Image Upload */}
                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Business License Doc</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'shop_license_image')}
                          required={!formData.shop_license_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.shop_license_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.shop_license_image ? (
                            <div className="upload-success-preview">
                              <img src={formData.shop_license_image} alt="License Preview" className="license-preview-img" style={{ maxHeight: '50px' }} />
                              <span style={{ fontSize: '0.7rem', textDecoration: 'underline' }}>Change</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1.1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload License Image</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="auth-grid-2">
                      {/* Logo Upload */}
                      <div className="file-upload-wrapper">
                        <label className="file-upload-label">Shop Logo</label>
                        <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                          <input
                            type="file" accept="image/*"
                            onChange={(e) => handleImageChange(e, 'shop_logo')}
                            required={!formData.shop_logo}
                            className="file-upload-input"
                          />
                          <div className="file-upload-content">
                            {uploadingFields.shop_logo ? (
                              <span className="upload-loader">Uploading...</span>
                            ) : formData.shop_logo ? (
                              <div className="upload-success-preview">
                                <img src={formData.shop_logo} alt="Logo Preview" className="license-preview-img" style={{ maxHeight: '50px' }} />
                                <span style={{ fontSize: '0.7rem', textDecoration: 'underline' }}>Change</span>
                              </div>
                            ) : (
                              <>
                                <FiUpload className="upload-icon" style={{ fontSize: '1.1rem' }} />
                                <span style={{ fontSize: '0.75rem' }}>Upload Logo</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Front Image Upload */}
                      <div className="file-upload-wrapper">
                        <label className="file-upload-label">Shop Front Image</label>
                        <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                          <input
                            type="file" accept="image/*"
                            onChange={(e) => handleImageChange(e, 'shop_front_image')}
                            required={!formData.shop_front_image}
                            className="file-upload-input"
                          />
                          <div className="file-upload-content">
                            {uploadingFields.shop_front_image ? (
                              <span className="upload-loader">Uploading...</span>
                            ) : formData.shop_front_image ? (
                              <div className="upload-success-preview">
                                <img src={formData.shop_front_image} alt="Front Preview" className="license-preview-img" style={{ maxHeight: '50px' }} />
                                <span style={{ fontSize: '0.7rem', textDecoration: 'underline' }}>Change</span>
                              </div>
                            ) : (
                              <>
                                <FiUpload className="upload-icon" style={{ fontSize: '1.1rem' }} />
                                <span style={{ fontSize: '0.75rem' }}>Upload Front Image</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Consent */}
                  <div className="auth-section-title">⚖️ Terms & Consent</div>
                  <label className="auth-checkbox-group">
                    <input
                      type="checkbox"
                      name="agree_terms"
                      checked={formData.agree_terms}
                      onChange={handleChange}
                      required
                      className="auth-checkbox-input"
                    />
                    <span className="auth-checkbox-label">
                      I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a> of FreshKart.
                    </span>
                  </label>
                </>
              )}

              {selectedRole === 'delivery' && (
                <div className="delivery-signup-fields animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '20px 0' }}>
                  {/* Personal Information Section */}
                  <div className="auth-section-title">👤 Personal Information</div>
                  
                  <div className="file-upload-wrapper">
                    <label className="file-upload-label">Profile Photo *</label>
                    <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleImageChange(e, 'profile_photo')}
                        required={!formData.profile_photo}
                        className="file-upload-input"
                      />
                      <div className="file-upload-content">
                        {uploadingFields.profile_photo ? (
                          <span className="upload-loader">Uploading...</span>
                        ) : formData.profile_photo ? (
                          <div className="upload-success-preview">
                            <img src={formData.profile_photo} alt="Profile Preview" className="license-preview-img" style={{ maxHeight: '60px', borderRadius: '50%' }} />
                            <span style={{ fontSize: '0.7rem', textDecoration: 'underline' }}>Change</span>
                          </div>
                        ) : (
                          <>
                            <FiUpload className="upload-icon" style={{ fontSize: '1.1rem' }} />
                            <span style={{ fontSize: '0.75rem' }}>Upload Profile Photo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Identity Verification Section */}
                  <div className="auth-section-title"> Identity Verification</div>
                  
                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="aadhaar_card" placeholder="Aadhaar Number *"
                        value={formData.aadhaar_card} onChange={handleChange} required
                        maxLength={12} minLength={12}
                      />
                    </div>
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="pan_card" placeholder="PAN Number *"
                        value={formData.pan_card} onChange={handleChange} required
                        maxLength={10} minLength={10} style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Aadhaar Card Front *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'aadhaar_front_image')}
                          required={!formData.aadhaar_front_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.aadhaar_front_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.aadhaar_front_image ? (
                            <div className="upload-success-preview">
                              <img src={formData.aadhaar_front_image} alt="Aadhaar Front Preview" style={{ maxHeight: '40px' }} />
                              <span style={{ fontSize: '0.65rem' }}>Change</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload Front</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Aadhaar Card Back *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'aadhaar_back_image')}
                          required={!formData.aadhaar_back_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.aadhaar_back_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.aadhaar_back_image ? (
                            <div className="upload-success-preview">
                              <img src={formData.aadhaar_back_image} alt="Aadhaar Back Preview" style={{ maxHeight: '40px' }} />
                              <span style={{ fontSize: '0.65rem' }}>Change</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload Back</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">PAN Card *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'pan_card_image')}
                          required={!formData.pan_card_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.pan_card_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.pan_card_image ? (
                            <div className="upload-success-preview">
                              <img src={formData.pan_card_image} alt="PAN Preview" style={{ maxHeight: '40px' }} />
                              <span style={{ fontSize: '0.65rem' }}>Change</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload PAN</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Live Selfie *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'live_selfie_image')}
                          required={!formData.live_selfie_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.live_selfie_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.live_selfie_image ? (
                            <div className="upload-success-preview">
                              <img src={formData.live_selfie_image} alt="Selfie Preview" style={{ maxHeight: '40px' }} />
                              <span style={{ fontSize: '0.65rem' }}>Change</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload Selfie</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driving & Vehicle Details Section */}
                  <div className="auth-section-title">🏍️ Driving & Vehicle Details</div>

                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="driving_license_number" placeholder="Driving Licence Number *"
                        value={formData.driving_license_number} onChange={handleChange} required
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div className="input-group">
                      <select
                        name="vehicle_type"
                        value={formData.vehicle_type}
                        onChange={handleChange}
                        required
                        className="auth-select"
                        style={{ paddingLeft: 'calc(var(--space-4) + 28px)' }}
                      >
                        <option value="bike">🛵 Vehicle: Bike</option>
                        <option value="scooter">🛵 Vehicle: Scooter</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <MdDirectionsBike className="input-icon" />
                    <input
                      type="text" name="vehicle_number" placeholder="Vehicle Registration Number (RC) *"
                      value={formData.vehicle_number} onChange={handleChange} required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="auth-grid-3">
                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Driving Licence *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'driving_license_image')}
                          required={!formData.driving_license_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.driving_license_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.driving_license_image ? (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}> Uploaded</span>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload DL</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">RC Book *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'rc_book_image')}
                          required={!formData.rc_book_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.rc_book_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.rc_book_image ? (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}> Uploaded</span>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload RC</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="file-upload-wrapper">
                      <label className="file-upload-label">Vehicle Insurance *</label>
                      <div className="file-upload-box" style={{ padding: 'var(--space-3)' }}>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => handleImageChange(e, 'vehicle_insurance_image')}
                          required={!formData.vehicle_insurance_image}
                          className="file-upload-input"
                        />
                        <div className="file-upload-content">
                          {uploadingFields.vehicle_insurance_image ? (
                            <span className="upload-loader">Uploading...</span>
                          ) : formData.vehicle_insurance_image ? (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}> Uploaded</span>
                          ) : (
                            <>
                              <FiUpload className="upload-icon" style={{ fontSize: '1rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>Upload Ins.</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="auth-section-title"> Address & Location Pinpointing</div>
                  <div className="input-group">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="current_address" placeholder="Current Address *"
                      value={formData.current_address} onChange={handleChange} required
                    />
                  </div>
                  <div className="auth-grid-3">
                    <div className="input-group">
                      <input
                        type="text" name="city" placeholder="City *"
                        value={formData.city} onChange={handleChange} required
                      />
                    </div>
                    <div className="input-group">
                      <input
                        type="text" name="state" placeholder="State *"
                        value={formData.state} onChange={handleChange} required
                      />
                    </div>
                    <div className="input-group">
                      <input
                        type="text" name="pin_code" placeholder="PIN Code *"
                        value={formData.pin_code} onChange={handleChange} required
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: '15px' }}>
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="gps_location" placeholder="GPS Location Coordinates (Pinpoint on map below) *"
                      value={formData.gps_location} onChange={handleChange} required readOnly
                    />
                  </div>
                  <LocationPickerMap
                    value={formData.gps_location}
                    onChange={(coords) => setFormData(prev => ({ ...prev, gps_location: coords }))}
                    onAddressResolve={(addr) => setFormData(prev => ({
                      ...prev,
                      current_address: addr.current_address,
                      city: addr.city,
                      state: addr.state,
                      pin_code: addr.pin_code
                    }))}
                  />

                  {/* Bank Details Section */}
                  <div className="auth-section-title"> Bank Details</div>
                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiUser className="input-icon" />
                      <input
                        type="text" name="bank_account_holder_name" placeholder="Account Holder Name *"
                        value={formData.bank_account_holder_name} onChange={handleChange} required
                      />
                    </div>
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="bank_name" placeholder="Bank Name *"
                        value={formData.bank_name} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="bank_account_number" placeholder="Account Number *"
                        value={formData.bank_account_number} onChange={handleChange} required
                      />
                    </div>
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="bank_ifsc_code" placeholder="IFSC Code *"
                        value={formData.bank_ifsc_code} onChange={handleChange} required
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  {/* Work Preferences Section */}
                  <div className="auth-section-title">⚙️ Work Preferences</div>
                  <div className="input-group">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text" name="preferred_delivery_area" placeholder="Preferred Delivery Area *"
                      value={formData.preferred_delivery_area} onChange={handleChange} required
                    />
                  </div>
                  <div className="auth-grid-2">
                    <div className="input-group">
                      <FiFileText className="input-icon" />
                      <input
                        type="text" name="languages_known" placeholder="Languages Known (e.g. English, Hindi)"
                        value={formData.languages_known} onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <select
                        name="work_type"
                        value={formData.work_type}
                        onChange={handleChange}
                        required
                        className="auth-select"
                        style={{ paddingLeft: 'calc(var(--space-4) + 28px)' }}
                      >
                        <option value="full-time">⏱️ Full-Time</option>
                        <option value="part-time">⏱️ Part-Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="auth-section-title">🚨 Emergency Contacts (Two Numbers)</div>
                  <div className="auth-grid-2">
                    <div className="input-group animate-fadeIn" style={{ margin: 0 }}>
                      <input
                        type="tel" name="emergency_contact_phone" placeholder="Emergency Contact Number 1 *"
                        value={formData.emergency_contact_phone} onChange={handleChange} required
                      />
                    </div>
                    <div className="input-group animate-fadeIn" style={{ margin: 0 }}>
                      <input
                        type="tel" name="emergency_contact_relationship" placeholder="Emergency Contact Number 2 *"
                        value={formData.emergency_contact_relationship} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="auth-section-title">🔑 Required Permissions</div>
                  <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}> Location Access (Always Allow while delivering)</span>
                      <button
                        type="button"
                        onClick={() => togglePermission('location')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: permissions.location ? '#10b981' : '#475569',
                          color: 'white',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {permissions.location ? 'Allowed' : 'Grant'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>📷 Camera Access</span>
                      <button
                        type="button"
                        onClick={() => togglePermission('camera')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: permissions.camera ? '#10b981' : '#475569',
                          color: 'white',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {permissions.camera ? 'Allowed' : 'Grant'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>🖼️ Storage/Photos Access</span>
                      <button
                        type="button"
                        onClick={() => togglePermission('storage')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: permissions.storage ? '#10b981' : '#475569',
                          color: 'white',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {permissions.storage ? 'Allowed' : 'Grant'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>🔔 Push Notifications</span>
                      <button
                        type="button"
                        onClick={() => togglePermission('notifications')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: permissions.notifications ? '#10b981' : '#475569',
                          color: 'white',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {permissions.notifications ? 'Allowed' : 'Grant'}
                      </button>
                    </div>
                  </div>

                  {/* Declaration Section */}
                  <div className="auth-section-title">⚖️ Declaration & Consent</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '5px' }}>
                    <label className="auth-checkbox-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="agree_info_accurate"
                        checked={formData.agree_info_accurate}
                        onChange={handleChange}
                        required
                        className="auth-checkbox-input"
                        style={{ marginTop: '3px' }}
                      />
                      <span className="auth-checkbox-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        I confirm that all information provided is accurate.
                      </span>
                    </label>

                    <label className="auth-checkbox-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="agree_terms_privacy"
                        checked={formData.agree_terms_privacy}
                        onChange={handleChange}
                        required
                        className="auth-checkbox-input"
                        style={{ marginTop: '3px' }}
                      />
                      <span className="auth-checkbox-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        I have read and agree to the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>Terms & Conditions</span> and <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPrivacyModal(true); }} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>Privacy Policy</span>.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="input-group">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" placeholder="Password (min 6 chars)"
                  value={formData.password} onChange={handleChange} required minLength={6} id="signup-password"
                />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <button type="submit" className="btn-submit" disabled={loading} id="signup-submit-btn">
                {loading ? <span className="btn-loader" /> : <>Create Account <FiArrowRight /></>}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div className="modal-content animate-scaleIn" style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8' }}>Terms & Conditions</h2>
              <button onClick={() => setShowTermsModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '0.85rem', lineHeight: '1.6', flex: 1, color: '#cbd5e1' }}>
              <h3 style={{ marginTop: 0, color: 'white' }}>Delivery Partner Agreement</h3>
              <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li style={{ marginBottom: '8px' }}>The delivery partner must provide genuine and valid identity documents.</li>
                <li style={{ marginBottom: '8px' }}>The delivery partner is responsible for maintaining the safety and quality of every order.</li>
                <li style={{ marginBottom: '8px' }}>Fraudulent activities, fake deliveries, or misuse of the platform will result in permanent account suspension.</li>
                <li style={{ marginBottom: '8px' }}>The delivery partner must obey all traffic laws and wear safety gear while delivering.</li>
                <li style={{ marginBottom: '8px' }}>Customer information is confidential and must never be shared.</li>
                <li style={{ marginBottom: '8px' }}>Payments will be processed according to the company's payment cycle.</li>
                <li style={{ marginBottom: '8px' }}>The company may temporarily suspend or permanently deactivate accounts that violate policies.</li>
                <li style={{ marginBottom: '8px' }}>The company reserves the right to update these terms at any time.</li>
                <li style={{ marginBottom: '8px' }}>Delivery partners must maintain professional behavior with customers, restaurants, and support staff.</li>
                <li style={{ marginBottom: '8px' }}>By clicking <strong>Accept</strong>, you agree to all Terms & Conditions.</li>
              </ol>
            </div>
            <div style={{ padding: '15px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#0f172a' }}>
              <button
                type="button"
                onClick={() => { setFormData(prev => ({ ...prev, agree_terms_privacy: false })); setShowTermsModal(false); }}
                style={{ padding: '8px 16px', background: '#3b4252', color: '#e5e9f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => { setFormData(prev => ({ ...prev, agree_terms_privacy: true })); setShowTermsModal(false); }}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div className="modal-content animate-scaleIn" style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8' }}>Privacy Policy</h2>
              <button onClick={() => setShowPrivacyModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '0.85rem', lineHeight: '1.6', flex: 1, color: '#cbd5e1' }}>
              <p>We collect your information to verify your identity, process payments, assign deliveries, improve services, and comply with legal requirements.</p>
              
              <h4 style={{ color: '#38bdf8', marginTop: '15px', marginBottom: '5px' }}>Information We Collect</h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Full Name</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>Aadhaar Details</li>
                <li>PAN Details</li>
                <li>Driving Licence Details</li>
                <li>Vehicle Information</li>
                <li>Bank Account Details</li>
                <li>GPS Location During Deliveries</li>
                <li>Device Information</li>
                <li>Profile Photo and Selfie</li>
              </ul>

              <h4 style={{ color: '#38bdf8', marginTop: '15px', marginBottom: '5px' }}>How We Use Your Data</h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Verify your identity.</li>
                <li>Assign delivery orders.</li>
                <li>Process earnings and incentives.</li>
                <li>Prevent fraud.</li>
                <li>Improve application performance.</li>
                <li>Provide customer support.</li>
                <li>Comply with legal obligations.</li>
              </ul>

              <h4 style={{ color: '#38bdf8', marginTop: '15px', marginBottom: '5px' }}>Data Security</h4>
              <p>Your personal information is encrypted and stored securely. We do not sell your personal information to third parties. Data is shared only with authorized verification agencies, payment providers, or government authorities when legally required.</p>

              <h4 style={{ color: '#38bdf8', marginTop: '15px', marginBottom: '5px' }}>Your Rights</h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>View your information.</li>
                <li>Update your profile.</li>
                <li>Request correction of incorrect information.</li>
                <li>Request account deletion, subject to legal requirements.</li>
              </ul>
              <p style={{ marginTop: '15px', fontWeight: 600 }}>By tapping <strong>Accept</strong>, you consent to this Privacy Policy.</p>
            </div>
            <div style={{ padding: '15px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#0f172a' }}>
              <button
                type="button"
                onClick={() => { setFormData(prev => ({ ...prev, agree_terms_privacy: false })); setShowPrivacyModal(false); }}
                style={{ padding: '8px 16px', background: '#3b4252', color: '#e5e9f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => { setFormData(prev => ({ ...prev, agree_terms_privacy: true })); setShowPrivacyModal(false); }}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="modal-content animate-scaleIn" style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '4rem' }}></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#10b981' }}>Application Submitted!</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#cbd5e1' }}>
              Your application has been submitted successfully. Our verification team will review your documents. Once approved, you can start accepting delivery orders.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/delivery/home');
              }}
              style={{ marginTop: '10px', padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%', transition: 'all 0.2s' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
