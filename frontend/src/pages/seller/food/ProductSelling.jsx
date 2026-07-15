import { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiChevronRight, 
  FiChevronLeft, FiAlertTriangle, FiUpload, FiSearch, FiLayers, 
  FiInfo, FiSettings, FiCamera, FiTag, FiShoppingBag, FiTruck, FiDollarSign 
} from 'react-icons/fi';
import { productService } from '../../../services/productService';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/dashboard.css';

const FOOD_CATEGORIES = {
  'Starters': ['Veg Starters', 'Non-Veg Starters'],
  'Main Course': ['Veg Main Course', 'Non-Veg Main Course'],
  'Shakes': ['Fruit Shakes', 'Chocolate Shakes', 'Ice Cream Shakes'],
  'Desserts': ['Cakes & Pastries', 'Ice Cream', 'Indian Sweets'],
  'Beverages': ['Hot Beverages', 'Cold Drinks', 'Mocktails']
};

export default function ProductSelling({ domain = 'food' }) {
  const { user, updateProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, onboarding, batch
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated sync states
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  
  // Wizard product form data
  const initialFormState = {
    name: '',
    price: '',
    category: '',
    stock_count: '',
    image_url: '',
    
    // --- Food specific details ---
    subcategory: '',
    dietary_tag: 'veg', // veg, non-veg, egg
    gst_classification: 'goods_5', // goods_5 (5%), services_18 (18%)
    serves_how_many: '1',
    spice_level: 'medium', // mild, medium, hot
    allergen_info: '',
    in_stock: true,
    
    // Food Variants
    variants: [], // { name: 'Regular', price: 100 }
    
    // Food Addons
    addons: [], // { name: 'Extra Cheese', price: 30 }
    
    // Special Food Categories
    is_cake: false,
    cake_variants: [], // { weight: '500g', price: 500 }
    cake_eggless_price: '',
    
    is_combo: false,
    combo_items: [], // { name: 'Burger', qty: 1, price: 90 }
    
    // --- Grocery specific details ---
    brand_name: '',
    mrp: '',
    pack_size: '',
    barcode: '',
    back_image_url: '',
    nutritional_info: '',
    manufacturer_details: '',
    shelf_life: '',
    storage_instructions: '',
    fssai_printed: '',
    return_policy: 'Non-returnable',
    apob_registration: '',
    batch_number: '',
    tcs_gst_compliant: true,
    
    // Status
    status: 'draft' // draft, under_review, live
  };
  
  const [formData, setFormData] = useState(initialFormState);
  
  // Inline onboarding details state
  const [onboardingForm, setOnboardingForm] = useState({
    shop_name: '',
    shop_owner_name: '',
    shop_address: '',
    gps_location: '',
    shop_license: '', // FSSAI
    pan_card: '',
    gstin: '',
    bank_account_details: '',
    cuisine_type: '',
    operating_hours: '',
    shop_logo: '',
    shop_front_image: '',
    shop_interior_image: '',
    shop_kitchen_image: '',
    cancelled_cheque_image: '',
    trademark_certificate: ''
  });
  
  const [uploadingFields, setUploadingFields] = useState({});
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Derived state and handlers for food category/subcategory selects
  const isCategoryPredefined = formData.category in FOOD_CATEGORIES;
  const categorySelectValue = formData.category 
    ? (isCategoryPredefined ? formData.category : 'Other') 
    : '';

  const currentSubcategories = FOOD_CATEGORIES[categorySelectValue] || [];
  const isSubcategoryPredefined = currentSubcategories.includes(formData.subcategory);
  const subcategorySelectValue = formData.subcategory
    ? (isSubcategoryPredefined ? formData.subcategory : 'Other')
    : '';

  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setFormData(prev => ({ ...prev, category: '', subcategory: '' }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        category: val, 
        subcategory: '' 
      }));
    }
  };

  const modalInputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.9rem'
  };

  const optionStyle = {
    background: '#1e293b',
    color: '#f8fafc'
  };

  // Initialize onboarding form from user profile
  useEffect(() => {
    if (user) {
      setOnboardingForm({
        shop_name: user.shop_name || '',
        shop_owner_name: user.shop_owner_name || '',
        shop_address: user.shop_address || '',
        gps_location: user.gps_location || '',
        shop_license: user.shop_license || '',
        pan_card: user.pan_card || '',
        gstin: user.gstin || '',
        bank_account_details: user.bank_account_details || '',
        cuisine_type: user.cuisine_type || '',
        operating_hours: user.operating_hours || '',
        shop_logo: user.shop_logo || '',
        shop_front_image: user.shop_front_image || '',
        shop_interior_image: user.shop_interior_image || '',
        shop_kitchen_image: user.shop_kitchen_image || '',
        cancelled_cheque_image: user.cancelled_cheque_image || '',
        trademark_certificate: user.trademark_certificate || ''
      });
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [domain]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getSellerProducts(domain);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if Stage 1 is fully complete
  const checkOnboardingComplete = () => {
    if (!user) return false;
    const requiredCommon = [
      user.shop_name, 
      user.shop_address, 
      user.gps_location, 
      user.shop_license, // FSSAI
      user.pan_card, 
      user.bank_account_details
    ];
    
    if (domain === 'food') {
      return requiredCommon.every(Boolean);
    } else {
      const requiredGrocery = [
        user.gstin, 
        user.shop_logo,
        user.shop_front_image,
        user.cancelled_cheque_image,
        user.trademark_certificate
      ];
      return requiredCommon.every(Boolean) && requiredGrocery.every(Boolean);
    }
  };

  const isOnboardingComplete = checkOnboardingComplete();

  // Onboarding list items status helper
  const getOnboardingChecklist = () => {
    const checklist = [];
    checklist.push({ key: 'shop_name', label: 'Restaurant/Shop Name & Owner Details', checked: !!user?.shop_name && !!user?.shop_owner_name });
    checklist.push({ key: 'gps_location', label: 'Address & Exact GPS Map Pin Location', checked: !!user?.shop_address && !!user?.gps_location });
    checklist.push({ key: 'shop_license', label: 'FSSAI License Number Registered', checked: !!user?.shop_license });
    checklist.push({ key: 'pan_card', label: domain === 'food' ? 'PAN Card Number' : 'PAN & GSTIN Registration', checked: domain === 'food' ? !!user?.pan_card : (!!user?.pan_card && !!user?.gstin) });
    checklist.push({ key: 'bank_account_details', label: 'Bank Account Payout Details', checked: !!user?.bank_account_details });
    
    if (domain === 'food') {
      // Cuisine Type & Operating Hours and Photos checklist items are removed
    } else {
      checklist.push({ key: 'trademark', label: 'Trademark Certificate / Brand Authorization', checked: !!user?.trademark_certificate });
      checklist.push({ key: 'cheque', label: 'Cancelled Cheque & Onboarding Files', checked: !!user?.shop_logo && !!user?.shop_front_image && !!user?.cancelled_cheque_image });
    }
    return checklist;
  };

  const handleOnboardingChange = (e) => {
    setOnboardingForm({ ...onboardingForm, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
      const response = await productService.uploadProductImage(file);
      
      // Update onboarding form or product form
      if (fieldName in onboardingForm) {
        setOnboardingForm(prev => ({ ...prev, [fieldName]: response.url }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: response.url }));
      }
    } catch (err) {
      console.error(`${fieldName} upload failed`, err);
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSaveOnboarding = async (e) => {
    e.preventDefault();
    setOnboardingSaving(true);
    try {
      await updateProfile(onboardingForm);
      alert('Stage 1 Onboarding completed successfully! You can now manage products.');
      setActiveTab('inventory');
    } catch (err) {
      console.error(err);
      alert('Failed to update onboarding profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setOnboardingSaving(false);
    }
  };

  // Add items dynamically to Variants or Addons tables
  const addVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { name: '', price: '' }] });
  };
  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };
  const removeVariant = (index) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== index) });
  };

  const addCakeVariant = () => {
    setFormData({ ...formData, cake_variants: [...(formData.cake_variants || []), { weight: '', price: '' }] });
  };
  const updateCakeVariant = (index, field, value) => {
    const newVariants = [...(formData.cake_variants || [])];
    newVariants[index][field] = value;
    setFormData({ ...formData, cake_variants: newVariants });
  };
  const removeCakeVariant = (index) => {
    setFormData({ ...formData, cake_variants: (formData.cake_variants || []).filter((_, i) => i !== index) });
  };

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', price: '' }]
    }));
  };

  const updateAddon = (index, field, value) => {
    const newAddons = [...formData.addons];
    newAddons[index] = { ...newAddons[index], [field]: value };
    setFormData(prev => ({ ...prev, addons: newAddons }));
  };

  const removeAddon = (index) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  // Bundle Combo items
  const addComboItem = () => {
    setFormData(prev => ({
      ...prev,
      combo_items: [...prev.combo_items, { name: '', qty: 1, price: '' }]
    }));
  };

  const updateComboItem = (index, field, value) => {
    const newItems = [...formData.combo_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, combo_items: newItems }));
  };

  const removeComboItem = (index) => {
    setFormData(prev => ({
      ...prev,
      combo_items: prev.combo_items.filter((_, i) => i !== index)
    }));
  };

  // Form step navigation & submission
  const nextStep = () => {
    // Perform simple stage validation
    if (currentStep === 1) {
      if (domain === 'food') {
        if (!formData.category) return alert('Category is mandatory.');
      } else {
        if (!formData.name || !formData.brand_name || !formData.category || !formData.mrp || !formData.price || !formData.pack_size) {
          return alert('All Master Data fields are mandatory.');
        }
        if (parseFloat(formData.price) > parseFloat(formData.mrp)) {
          return alert('Selling Price cannot exceed Maximum Retail Price (MRP).');
        }
      }
    }
    
    if (currentStep === 2 && domain === 'food') {
      if (!formData.name || !formData.price || !formData.stock_count) {
        return alert('Name, Price, and Stock Count are mandatory.');
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Submit wizard product creation/update
  const handleProductSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock_count, 10),
      };

      if (isEditingProduct) {
        await productService.updateProduct(editingProductId, payload);
        alert('Product updated successfully!');
      } else {
        // Zomato/Swiggy or Instamart Go Live Simulator
        // We set status to 'under_review' first
        payload.status = 'under_review';
        const result = await productService.createProduct(payload, domain);
        
        // Add to sync queue for batch release
        setSyncQueue(prev => [...prev, result.product]);
        alert('Product submitted for review! It has been added to your catalog.');
      }
      
      setIsModalOpen(false);
      setIsEditingProduct(false);
      setFormData(initialFormState);
      setCurrentStep(1);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Failed to save product: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (item) => {
    setIsEditingProduct(true);
    setEditingProductId(item.product_id);
    
    // Map existing attributes into form state
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category: item.category || '',
      stock_count: item.stock_count || '',
      image_url: item.image_url || '',
      
      subcategory: item.subcategory || '',
      dietary_tag: item.dietary_tag || 'veg',
      gst_classification: item.gst_classification || 'goods_5',
      serves_how_many: item.serves_how_many || '1',
      spice_level: item.spice_level || 'medium',
      allergen_info: item.allergen_info || '',
      in_stock: item.in_stock !== undefined ? item.in_stock : true,
      variants: item.variants || [],
      addons: item.addons || [],
      is_cake: item.is_cake || false,
      cake_variants: item.cake_variants || [],
      cake_eggless_price: item.cake_eggless_price || '',
      is_combo: item.is_combo || false,
      combo_items: item.combo_items || [],
      
      brand_name: item.brand_name || '',
      mrp: item.mrp || '',
      pack_size: item.pack_size || '',
      barcode: item.barcode || '',
      back_image_url: item.back_image_url || '',
      nutritional_info: item.nutritional_info || '',
      manufacturer_details: item.manufacturer_details || '',
      shelf_life: item.shelf_life || '',
      storage_instructions: item.storage_instructions || '',
      fssai_printed: item.fssai_printed || '',
      return_policy: item.return_policy || 'Non-returnable',
      apob_registration: item.apob_registration || '',
      batch_number: item.batch_number || '',
      tcs_gst_compliant: item.tcs_gst_compliant !== undefined ? item.tcs_gst_compliant : true,
      status: item.status || 'live'
    });
    
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(id);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  // Simulated batch release / syncing
  const triggerBatchSync = () => {
    if (syncQueue.length === 0) return alert('No pending reviews in the queue.');
    setSyncing(true);
    setSyncProgress('Authenticating updates with Catalog Manager...');
    
    setTimeout(() => {
      setSyncProgress('Deploying menu updates. Items will show toggled off briefly...');
      
      // Update local products status to live in memory/backend
      // In this simulation, we proceed to live state
      setTimeout(async () => {
        try {
          for (const item of syncQueue) {
            await productService.updateProduct(item.product_id, { status: 'live' });
          }
          setSyncQueue([]);
          fetchProducts();
          alert('Batch Menu Update Live! All items synced successfully.');
        } catch (e) {
          console.error(e);
        } finally {
          setSyncing(false);
          setSyncProgress('');
        }
      }, 3000);
    }, 2000);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grocery commission selector slab
  const getCommissionSlab = (cat) => {
    const category = (cat || '').toLowerCase();
    if (category.includes('atta') || category.includes('rice') || category.includes('dal') || category.includes('staple')) {
      return '5% Slab (Staples & Essentials)';
    }
    if (category.includes('personal') || category.includes('beauty') || category.includes('care') || category.includes('shampoo')) {
      return '15% Slab (Premium Personal Care)';
    }
    return '10% Slab (General Foods & Snacks)';
  };

  return (
    <div className="dashboard-page" id={`seller-${domain}-products`}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1> Catalog Management ({domain.toUpperCase()})</h1>
          <p>Complete onboarding, organize menu structures, and control inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {domain === 'food' && (
            <button 
              onClick={() => setActiveTab('batch')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                background: activeTab === 'batch' ? '#d1fae5' : '#f3f4f6', 
                color: activeTab === 'batch' ? '#065f46' : '#4b5563',
                border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
               Batch Updates ({syncQueue.length})
            </button>
          )}
          <button 
            onClick={() => setActiveTab('onboarding')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              background: activeTab === 'onboarding' ? '#d1fae5' : '#f3f4f6', 
              color: activeTab === 'onboarding' ? '#065f46' : '#4b5563',
              border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
             Onboarding Checklist {isOnboardingComplete ? '' : ''}
          </button>
          <button 
            onClick={() => {
              if (!isOnboardingComplete) {
                alert('Please complete Stage 1: Onboarding Setup before uploading items.');
                setActiveTab('onboarding');
                return;
              }
              setIsEditingProduct(false);
              setFormData(initialFormState);
              setCurrentStep(1);
              setIsModalOpen(true);
            }} 
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <FiPlus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Onboarding Alert Banner */}
      {!isOnboardingComplete && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiAlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>Action Required: Stage 1 Onboarding Setup is Incomplete!</strong>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem' }}>You must verify your business coordinates, FSSAI license, banking payout details, and store photos before your catalog can go live.</p>
          </div>
          <button onClick={() => setActiveTab('onboarding')} style={{ marginLeft: 'auto', padding: '6px 12px', background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Complete Now</button>
        </div>
      )}

      {/* TABS CONTAINER */}
      {activeTab === 'onboarding' && (
        <div className="content-card">
          <div className="content-card-header">
            <h2> Onboarding Checklist Status</h2>
            <button onClick={() => setActiveTab('inventory')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><FiX size={20}/></button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <h3>Stage 1 Setup Verification</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Verify that the following criteria are met to allow catalogs to go live immediately:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getOnboardingChecklist().map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.checked ? '' : ''}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3> Edit Onboarding Profile Info</h3>
              <form onSubmit={handleSaveOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restaurant/Shop Name</label>
                    <input name="shop_name" value={onboardingForm.shop_name} onChange={handleOnboardingChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Owner Name</label>
                    <input name="shop_owner_name" value={onboardingForm.shop_owner_name} onChange={handleOnboardingChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Address</label>
                  <textarea name="shop_address" value={onboardingForm.shop_address} onChange={handleOnboardingChange} required rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GPS Coordinate Location Pin</label>
                    <input name="gps_location" value={onboardingForm.gps_location} onChange={handleOnboardingChange} placeholder="e.g. 12.9716, 77.5946" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FSSAI License Number</label>
                    <input name="shop_license" value={onboardingForm.shop_license} onChange={handleOnboardingChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PAN Card Number</label>
                    <input name="pan_card" value={onboardingForm.pan_card} onChange={handleOnboardingChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                  {domain === 'grocery' ? (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GSTIN Registration</label>
                      <input name="gstin" value={onboardingForm.gstin} onChange={handleOnboardingChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operating Hours</label>
                      <input name="operating_hours" value={onboardingForm.operating_hours} onChange={handleOnboardingChange} placeholder="e.g. 9 AM - 11 PM" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>



                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bank Payout (Bank, A/C No, IFSC)</label>
                  <input name="bank_account_details" value={onboardingForm.bank_account_details} onChange={handleOnboardingChange} required placeholder="Bank Name, A/C: 1234567, IFSC: ABCD000123" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>

                {/* Onboarding Photos Upload */}
                <div style={{ marginTop: '10px', background: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>📁 Stage 1 Documents & Verification Images</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Store Logo</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'shop_logo')} style={{ display: 'none' }} id="onboard-logo" />
                      <label htmlFor="onboard-logo" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                        {uploadingFields.shop_logo ? '...' : onboardingForm.shop_logo ? 'Done ✓' : 'Upload'}
                      </label>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Front Photo</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'shop_front_image')} style={{ display: 'none' }} id="onboard-front" />
                      <label htmlFor="onboard-front" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                        {uploadingFields.shop_front_image ? '...' : onboardingForm.shop_front_image ? 'Done ✓' : 'Upload'}
                      </label>
                    </div>

                    {domain === 'food' ? (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Kitchen Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'shop_kitchen_image')} style={{ display: 'none' }} id="onboard-kitchen" />
                        <label htmlFor="onboard-kitchen" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          {uploadingFields.shop_kitchen_image ? '...' : onboardingForm.shop_kitchen_image ? 'Done ✓' : 'Upload'}
                        </label>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Brand Certificate</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'trademark_certificate')} style={{ display: 'none' }} id="onboard-trademark" />
                        <label htmlFor="onboard-trademark" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          {uploadingFields.trademark_certificate ? '...' : onboardingForm.trademark_certificate ? 'Done ✓' : 'Upload'}
                        </label>
                      </div>
                    )}

                    {domain === 'food' ? (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Interior Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'shop_interior_image')} style={{ display: 'none' }} id="onboard-interior" />
                        <label htmlFor="onboard-interior" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          {uploadingFields.shop_interior_image ? '...' : onboardingForm.shop_interior_image ? 'Done ✓' : 'Upload'}
                        </label>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Cancelled Cheque</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cancelled_cheque_image')} style={{ display: 'none' }} id="onboard-cheque" />
                        <label htmlFor="onboard-cheque" style={{ display: 'block', padding: '6px', background: '#10b981', color: 'white', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          {uploadingFields.cancelled_cheque_image ? '...' : onboardingForm.cancelled_cheque_image ? 'Done ✓' : 'Upload'}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={onboardingSaving} style={{ marginTop: '10px', padding: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: onboardingSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {onboardingSaving ? 'Saving details...' : 'Submit Stage 1 Details'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batch' && domain === 'food' && (
        <div className="content-card">
          <div className="content-card-header">
            <h2> Pending Menu Sync Queue (Batch Release)</h2>
            <button onClick={() => setActiveTab('inventory')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><FiX size={20}/></button>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
             When deploying updates on Swiggy or Zomato, uploading items one-by-one causes active menus to toggle off briefly. We batch updates together for a single transaction to maintain consistent customer visibility.
          </p>

          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
            <strong>Queue Size: {syncQueue.length} Products Pending Go Live</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              {syncQueue.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '5px' }}>
                  {item.name} ({item.category}) - ₹{item.price} - <span style={{ color: '#d97706', fontWeight: 600 }}>Under Review</span>
                </li>
              ))}
              {syncQueue.length === 0 && <li style={{ color: 'var(--text-secondary)', listStyleType: 'none' }}>No pending batch updates. Add products to fill the queue.</li>}
            </ul>
          </div>

          {syncing ? (
            <div style={{ textAlign: 'center', padding: '20px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div className="loader" style={{ display: 'inline-block', border: '3px solid #f3f4f6', borderTop: '3px solid #10b981', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', marginBottom: '10px' }}></div>
              <p style={{ color: '#065f46', fontWeight: 600, margin: 0 }}>{syncProgress}</p>
            </div>
          ) : (
            <button 
              onClick={triggerBatchSync} 
              disabled={syncQueue.length === 0} 
              style={{
                width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: syncQueue.length === 0 ? 'not-allowed' : 'pointer', opacity: syncQueue.length === 0 ? 0.6 : 1
              }}
            >
              Deploy Batch Sync Live Now
            </button>
          )}
        </div>
      )}

      {/* MAIN INVENTORY LIST VIEW */}
      {activeTab === 'inventory' && (
        <div className="content-card">
          <div className="content-card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
            <h2> Inventory Items</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '300px', background: 'var(--background)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <FiSearch style={{ color: 'var(--text-secondary)' }} />
              <input 
                placeholder="Search catalog..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', color: 'var(--text-primary)' }} 
              />
            </div>
          </div>
          
          {loading ? (
            <p style={{ padding: '20px' }}>Loading inventory...</p>
          ) : (
            <table className="data-table">
              <thead>
                {domain === 'food' ? (
                  <tr><th>Product</th><th>Menu Structure</th><th>Dietary Tag</th><th>Price</th><th>Stock Status</th><th>Go-Live State</th><th>Actions</th></tr>
                ) : (
                  <tr><th>Product & Brand</th><th>Category / Size</th><th>MRP / Price</th><th>EAN Barcode</th><th>Stock Status</th><th>Go-Live State</th><th>Actions</th></tr>
                )}
              </thead>
              <tbody>
                {filteredProducts.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No products found. Add some!</td></tr>}
                {filteredProducts.map((item) => {
                  const isLive = item.status === 'live' || item.status === undefined;
                  return (
                    <tr key={item.product_id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.5rem', width: '40px', height: '40px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                            {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : (domain === 'food' ? '' : '')}
                          </span>
                          <div>
                            <div>{item.name}</div>
                            {domain === 'grocery' && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Brand: {item.brand_name || 'N/A'}</span>}
                          </div>
                        </div>
                      </td>
                      
                      {domain === 'food' ? (
                        <>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}><strong>Cat:</strong> {item.category}</div>
                            {item.subcategory && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><strong>Sub:</strong> {item.subcategory}</div>}
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                              background: item.dietary_tag === 'veg' ? '#ecfdf5' : item.dietary_tag === 'egg' ? '#fffbeb' : '#fef2f2',
                              color: item.dietary_tag === 'veg' ? '#047857' : item.dietary_tag === 'egg' ? '#b45309' : '#b91c1c'
                            }}>
                              {item.dietary_tag === 'veg' ? ' Veg' : item.dietary_tag === 'egg' ? ' Egg' : ' Non-Veg'}
                            </span>
                          </td>
                          <td style={{ color: '#059669', fontWeight: 600 }}>₹{item.price}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}><strong>Cat:</strong> {item.category}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><strong>Size:</strong> {item.pack_size || 'N/A'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}><span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{item.mrp || item.price}</span></div>
                            <div style={{ color: '#059669', fontWeight: 600 }}>₹{item.price}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{item.barcode || 'N/A'}</td>
                        </>
                      )}

                      <td>
                        <span className={`status-badge ${item.stock_count > 0 ? 'active' : 'cancelled'}`}>
                          {item.stock_count > 0 ? `${item.stock_count} In Stock` : 'Out of Stock'}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge ${isLive ? 'active' : 'pending'}`} style={{ textTransform: 'capitalize' }}>
                          {item.status || 'live'}
                        </span>
                      </td>
                      
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditProduct(item)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}><FiEdit size={13} /></button>
                          <button onClick={() => handleDelete(item.product_id)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}><FiTrash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MULTI-STAGE PRODUCT UPLOAD WIZARD MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '30px', borderRadius: '16px', width: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)', color: '#f8fafc', margin: '20px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc' }}>{isEditingProduct ? ' Edit Product' : '➕ Upload New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FiX size={22}/></button>
            </div>

            {/* Step Progress Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(15, 23, 42, 0.4)', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              {domain === 'food' ? (
                // Food Steps: 1: Menu Structure, 2: Item Details, 3: Variants & Extras, 4: Go Live Preview
                ['Menu Setup', 'Item details', 'Variants & Add-ons', 'Go Live Review'].map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600,
                      background: currentStep === idx + 1 ? 'linear-gradient(135deg, #10b981, #059669)' : currentStep > idx + 1 ? 'var(--color-primary-dark)' : '#475569',
                      boxShadow: currentStep === idx + 1 ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                      color: 'white'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentStep === idx + 1 ? '#34d399' : '#94a3b8' }}>{label}</span>
                    {idx < 3 && <FiChevronRight size={14} style={{ color: '#475569' }} />}
                  </div>
                ))
              ) : (
                // Grocery Steps: 1: Master Data, 2: Product Content, 3: Inventory & Logistics, 4: Pricing & Compliance, 5: Category Sign-off
                ['Master Data', 'Content & Expiry', 'Inventory & APOB', 'Compliance', 'Sign-Off'].map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
                      background: currentStep === idx + 1 ? 'linear-gradient(135deg, #10b981, #059669)' : currentStep > idx + 1 ? 'var(--color-primary-dark)' : '#475569',
                      boxShadow: currentStep === idx + 1 ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                      color: 'white'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: currentStep === idx + 1 ? '#34d399' : '#94a3b8' }}>{label}</span>
                    {idx < 4 && <FiChevronRight size={12} style={{ color: '#475569' }} />}
                  </div>
                ))
              )}
            </div>

            {/* WIZARD FORM FIELDS */}
            <div style={{ marginBottom: '35px' }}>
              
              {/* ===================== FOOD DOMAIN WIZARD ===================== */}
              {domain === 'food' && (
                <>
                  {/* Step 1: Menu Structure */}
                  {currentStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h3 style={{ margin: 0, color: '#34d399' }}>🍴 Menu Structure Hierarchy</h3>
                      <div className="input-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Category (e.g. Starters, Main Course, Shakes, Desserts, Beverages) *</label>
                        <select
                          required
                          value={categorySelectValue}
                          onChange={handleCategorySelectChange}
                          style={modalInputStyle}
                        >
                          <option value="" disabled style={optionStyle}>-- Select Category --</option>
                          <option value="Starters" style={optionStyle}>Starters</option>
                          <option value="Main Course" style={optionStyle}>Main Course</option>
                          <option value="Shakes" style={optionStyle}>Shakes</option>
                          <option value="Desserts" style={optionStyle}>Desserts</option>
                          <option value="Beverages" style={optionStyle}>Beverages</option>
                          <option value="Other" style={optionStyle}>Other (Custom Category)</option>
                        </select>
                      </div>

                      {categorySelectValue === 'Other' && (
                        <div className="input-group" style={{ marginTop: '-10px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Custom Category Name *</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.category} 
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g. Rice Items" 
                            style={modalInputStyle} 
                          />
                        </div>
                      )}

                      <div className="input-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Sub-category (e.g. Veg Starters / Non-Veg Starters)</label>
                        <select
                          value={subcategorySelectValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setFormData(prev => ({ ...prev, subcategory: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, subcategory: val }));
                            }
                          }}
                          style={modalInputStyle}
                        >
                          <option value="" style={optionStyle}>-- Select Sub-category --</option>
                          {currentSubcategories.map((sub, index) => (
                            <option key={index} value={sub} style={optionStyle}>{sub}</option>
                          ))}
                          <option value="Other" style={optionStyle}>Other (Custom Sub-category)</option>
                        </select>
                      </div>

                      {(subcategorySelectValue === 'Other' || !isCategoryPredefined) && (
                        <div className="input-group" style={{ marginTop: '-10px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Custom Sub-category Name</label>
                          <input 
                            type="text" 
                            value={formData.subcategory} 
                            onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                            placeholder="e.g. Non-Veg Main Course" 
                            style={modalInputStyle} 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Item-Level Details */}
                  {currentStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h3> Item-Level Details</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Item Name *</label>
                          <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Price (₹) *</label>
                          <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Description (Short & engaging)</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Dietary Tag *</label>
                          <select value={formData.dietary_tag} onChange={e => setFormData({ ...formData, dietary_tag: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <option value="veg"> Veg</option>
                            <option value="egg"> Egg</option>
                            <option value="non-veg"> Non-Veg</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>GST Classification</label>
                          <select value={formData.gst_classification} onChange={e => setFormData({ ...formData, gst_classification: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <option value="goods_5">Goods (5% GST)</option>
                            <option value="services_18">Services (18% GST)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Initial Stock Count *</label>
                          <input required type="number" value={formData.stock_count} onChange={e => setFormData({ ...formData, stock_count: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Serves how many? (optional)</label>
                          <input type="number" value={formData.serves_how_many} onChange={e => setFormData({ ...formData, serves_how_many: e.target.value })} placeholder="e.g. 2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Spice Level</label>
                          <select value={formData.spice_level} onChange={e => setFormData({ ...formData, spice_level: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <option value="mild">Mild </option>
                            <option value="medium">Medium </option>
                            <option value="hot">Hot </option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Allergen Info (optional)</label>
                        <input type="text" value={formData.allergen_info} onChange={e => setFormData({ ...formData, allergen_info: e.target.value })} placeholder="e.g. Contains gluten, dairy, nuts" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>

                      {/* Photo upload with Zomato guidelines check */}
                      <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px dashed var(--border)', marginTop: '10px' }}>
                        <strong>🖼️ Item Photo Upload</strong>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 10px 0' }}> Zomato Guidelines: Centered dish, no watermark/logo, no hands in frame.</p>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image_url')} style={{ display: 'none' }} id="item-image-file" />
                          <label htmlFor="item-image-file" style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            {uploadingFields.image_url ? 'Uploading...' : 'Choose Dish Photo'}
                          </label>
                          {formData.image_url && <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Variants & Add-ons */}
                  {currentStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Variants */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3>✨ Product Variants</h3>
                          <button onClick={addVariant} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#d1fae5', color: '#047857', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            <FiPlus /> Add Variant
                          </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '10px' }}>Example: Size (Half/Full), Type (Regular/Large)</p>
                        {formData.variants.map((v, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <input placeholder="Variant (e.g. Regular)" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <input placeholder="Price Addition (₹)" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <button onClick={() => removeVariant(i)} style={{ padding: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                          </div>
                        ))}
                      </div>

                      {/* Add-ons */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3>➕ Add-ons / Modifiers</h3>
                          <button onClick={addAddon} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#d1fae5', color: '#047857', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            <FiPlus /> Add Add-on
                          </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '10px' }}>Example: Extra Cheese (+₹30), Extra Patty (+₹50)</p>
                        {formData.addons.map((ad, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <input placeholder="Add-on (e.g. Extra Cheese)" value={ad.name} onChange={e => updateAddon(i, 'name', e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <input placeholder="Price (₹)" type="number" value={ad.price} onChange={e => updateAddon(i, 'price', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <button onClick={() => removeAddon(i)} style={{ padding: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                          </div>
                        ))}
                      </div>

                      {/* Special Categories: Cakes / Combos */}
                      <div>
                        <h3> Special Categories</h3>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_cake} onChange={e => setFormData({ ...formData, is_cake: e.target.checked })} /> Cake Specific Attributes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_combo} onChange={e => setFormData({ ...formData, is_combo: e.target.checked })} /> Combo / Thali Pack
                          </label>
                        </div>

                        {formData.is_cake && (
                          <div style={{ marginTop: '15px', padding: '15px', background: '#f9fafb', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <strong>Cake Weight Variants</strong>
                              <button onClick={addCakeVariant} style={{ padding: '3px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Weight Variant</button>
                            </div>
                            {(formData.cake_variants || []).map((cv, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input placeholder="Weight (e.g. 500g)" value={cv.weight} onChange={e => updateCakeVariant(idx, 'weight', e.target.value)} style={{ flex: 3, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                <input placeholder="Price (₹)" type="number" value={cv.price} onChange={e => updateCakeVariant(idx, 'price', e.target.value)} style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                <button onClick={() => removeCakeVariant(idx)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><FiTrash2 size={12} /></button>
                              </div>
                            ))}
                            <div className="input-group" style={{ marginTop: '15px' }}>
                              <label>Eggless Surcharge Price (₹) (Optional)</label>
                              <input placeholder="e.g. 50" type="number" value={formData.cake_eggless_price || ''} onChange={e => setFormData({ ...formData, cake_eggless_price: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Extra charge if the buyer selects Eggless. Leave empty if no extra charge.</span>
                            </div>
                          </div>
                        )}

                        {formData.is_combo && (
                          <div style={{ marginTop: '15px', padding: '15px', background: '#f9fafb', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <strong>Bundled Thali/Combo Items List</strong>
                              <button onClick={addComboItem} style={{ padding: '3px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Item</button>
                            </div>
                            {formData.combo_items.map((ci, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input placeholder="Item Name (e.g. Butter Roti)" value={ci.name} onChange={e => updateComboItem(idx, 'name', e.target.value)} style={{ flex: 3, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                <input placeholder="Qty" type="number" value={ci.qty} onChange={e => updateComboItem(idx, 'qty', e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                <input placeholder="Individual Price" type="number" value={ci.price} onChange={e => updateComboItem(idx, 'price', e.target.value)} style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                <button onClick={() => removeComboItem(idx)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><FiTrash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Step 4: Go Live Preview */}
                  {currentStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h3> Review Menu Item</h3>
                      <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                        <div style={{ width: '100%', height: '120px', background: '#d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                          {formData.image_url ? <img src={formData.image_url} alt="Dish" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '3rem', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}></span>}
                        </div>
                        <div>
                          <h2 style={{ margin: '0 0 5px 0', color: '#111827' }}>{formData.name || 'Untitled Dish'}</h2>
                          <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}>₹{formData.price}</div>
                          <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '5px' }}>Category: {formData.category} &gt; {formData.subcategory || 'General'}</div>
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ marginRight: '8px', padding: '2px 6px', background: 'white', color: '#1f2937', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {formData.dietary_tag === 'veg' ? ' Veg' : formData.dietary_tag === 'egg' ? ' Egg' : ' Non-Veg'}
                            </span>
                            <span style={{ padding: '2px 6px', background: 'white', color: '#1f2937', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              Serves {formData.serves_how_many}
                            </span>
                          </div>
                        </div>
                      </div>


                    </div>
                  )}
                </>
              )}


              {/* ===================== GROCERY DOMAIN WIZARD ===================== */}
              {domain === 'grocery' && (
                <>
                  {/* Step 1: Product Master Data */}
                  {currentStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h3> Product Master Data (Zepto / Blinkit Catalog)</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Product / SKU Name *</label>
                          <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Tata Salt Iodized" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Brand Name *</label>
                          <input required value={formData.brand_name} onChange={e => setFormData({ ...formData, brand_name: e.target.value })} placeholder="e.g. Tata" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Category Hierarchy *</label>
                          <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Staples & Dals" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Sub-category Hierarchy</label>
                          <input value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} placeholder="e.g. Salt" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>MRP (Max Retail Price) *</label>
                          <input required type="number" value={formData.mrp} onChange={e => setFormData({ ...formData, mrp: e.target.value })} placeholder="₹30" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Selling Price *</label>
                          <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="₹28" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Pack Size / Qty / Wt *</label>
                          <input required value={formData.pack_size} onChange={e => setFormData({ ...formData, pack_size: e.target.value })} placeholder="e.g. 1 kg, 500 ml" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Barcode / EAN Code *</label>
                        <input required value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="e.g. 8901030752538" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Product Content */}
                  {currentStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h3>🥫 Product Label & Expiry Details</h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {/* Front Image */}
                        <div style={{ border: '1px dashed var(--border)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                          <strong>Front Pack Photo *</strong>
                          {formData.image_url && <img src={formData.image_url} alt="" style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '10px auto' }} />}
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image_url')} style={{ display: 'none' }} id="pack-front-img" />
                          <label htmlFor="pack-front-img" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Choose File</label>
                        </div>
                        
                        {/* Back Image */}
                        <div style={{ border: '1px dashed var(--border)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                          <strong>Back Pack Label (Ingredients) *</strong>
                          {formData.back_image_url && <img src={formData.back_image_url} alt="" style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '10px auto' }} />}
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'back_image_url')} style={{ display: 'none' }} id="pack-back-img" />
                          <label htmlFor="pack-back-img" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Choose File</label>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Shelf Life / Expiry Duration</label>
                          <input value={formData.shelf_life} onChange={e => setFormData({ ...formData, shelf_life: e.target.value })} placeholder="e.g. 6 Months from mfg" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>FSSAI License Number Printed on Pack *</label>
                          <input required value={formData.fssai_printed} onChange={e => setFormData({ ...formData, fssai_printed: e.target.value })} placeholder="e.g. 10012022000263" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Nutritional Information (Key details)</label>
                        <textarea value={formData.nutritional_info} onChange={e => setFormData({ ...formData, nutritional_info: e.target.value })} placeholder="e.g. Energy 400kcal, Carbohydrates 70g, Protein 9g per 100g" rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Manufacturer & Marketer Details</label>
                          <input value={formData.manufacturer_details} onChange={e => setFormData({ ...formData, manufacturer_details: e.target.value })} placeholder="e.g. Tata Consumer Products Ltd" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Storage Instructions</label>
                          <input value={formData.storage_instructions} onChange={e => setFormData({ ...formData, storage_instructions: e.target.value })} placeholder="e.g. Keep in dry and cool place" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Inventory & Logistics */}
                  {currentStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h3> Dark Store Logistics & Inventory</h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                          <label>Initial Stock Quantity (Warehouse count) *</label>
                          <input required type="number" value={formData.stock_count} onChange={e => setFormData({ ...formData, stock_count: e.target.value })} placeholder="100" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                        <div className="input-group">
                          <label>Batch / Lot Number (for perishables)</label>
                          <input value={formData.batch_number} onChange={e => setFormData({ ...formData, batch_number: e.target.value })} placeholder="e.g. LOT-A01" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>APOB (Additional Place of Business) Certificate Number per state</label>
                        <input value={formData.apob_registration} onChange={e => setFormData({ ...formData, apob_registration: e.target.value })} placeholder="e.g. APOB-KA-1294829" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>

                      <div style={{ background: '#ede9fe', padding: '12px', borderRadius: '8px', color: '#5b21b6', fontSize: '0.8rem' }}>
                        ⏰ <strong>Blinkit Fulfillment SLA warning:</strong> Dark stores run tight 10-minute delivery loops. Inaccurate stock counts can trigger stockout penalties and merchant deactivations. Keep numbers accurate!
                      </div>
                    </div>
                  )}

                  {/* Step 4: Pricing & Compliance */}
                  {currentStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h3> Commission Slabs & GST Compliance</h3>

                      <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '10px' }}>
                        <strong>Platform Commission Calculations:</strong>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem' }}>
                          <span>Category:</span>
                          <strong>{formData.category || 'General'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.9rem' }}>
                          <span>Calculated Slab:</span>
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{getCommissionSlab(formData.category)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.9rem', borderTop: '1px solid #d1d5db', paddingTop: '5px' }}>
                          <span>Commission Chargeable On:</span>
                          <strong>Selling Price (₹{formData.price}), NOT MRP (₹{formData.mrp})</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formData.tcs_gst_compliant} onChange={e => setFormData({ ...formData, tcs_gst_compliant: e.target.checked })} /> TCS & GST Compliance Declared
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Go Live Sign-off */}
                  {currentStep === 5 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h3> Category Manager Approval & Go Live</h3>

                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '20px', borderRadius: '12px' }}>
                        <h4>Catalog Sign-off Summary</h4>
                        <div style={{ fontSize: '0.85rem', color: '#065f46', marginTop: '10px' }}>
                          <div>✓ Product/SKU Master Data Verified</div>
                          <div>✓ FSSAI and Ingredient labels checked</div>
                          <div>✓ Barcode EAN format registered</div>
                          <div>✓ Dark store logistics synced</div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Upon clicking "Submit", a Category Manager approval task is generated. The item will show as "Under Review" before going live.
                      </p>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              {currentStep > 1 ? (
                <button onClick={prevStep} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  <FiChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {((domain === 'food' && currentStep < 4) || (domain === 'grocery' && currentStep < 5)) ? (
                <button onClick={nextStep} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Next <FiChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleProductSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Submitting...' : 'Submit to Live Catalog'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
