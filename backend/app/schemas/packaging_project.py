from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class ProductBasics(BaseModel):
    product_name: str = Field(..., description="Trade name of the commodity")
    brand_name: str = Field(..., description="Brand name")
    category: str = Field(..., description="Grocery category (e.g. Dry Fruits & Nuts, Snacks, Beverages, Spices, Grains)")
    sub_category: Optional[str] = None
    description: Optional[str] = None
    net_quantity: str = Field(..., description="Numeric package quantity e.g. 250")
    unit: str = Field(..., description="Statutory unit: g, kg, ml, L, pieces, etc.")

class BusinessLegal(BaseModel):
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    packer_name: Optional[str] = None
    packer_address: Optional[str] = None
    importer_name: Optional[str] = None
    importer_address: Optional[str] = None
    marketer_name: Optional[str] = None
    marketer_address: Optional[str] = None
    country_of_origin: Optional[str] = "India"
    manufacturing_location: Optional[str] = None
    consumer_care_phone: Optional[str] = None
    consumer_care_email: Optional[str] = None
    consumer_care_website: Optional[str] = None
    consumer_care_address: Optional[str] = None
    fssai_license: Optional[str] = None
    additional_license: Optional[str] = None

class IngredientItem(BaseModel):
    name: str
    percentage: Optional[str] = None
    is_major: bool = False

class NutrientItem(BaseModel):
    nutrient_name: str
    amount: str
    unit: str = "g"
    rda_percentage: Optional[str] = None

class FoodInfo(BaseModel):
    ingredients: List[IngredientItem] = []
    contains_allergens: List[str] = []
    may_contain_allergens: List[str] = []
    allergen_advice: Optional[str] = None
    veg_non_veg: str = "VEG" # VEG, NON_VEG, NOT_APPLICABLE

class NutritionData(BaseModel):
    basis: str = "Per 100 g" # Per 100 g, Per 100 ml, Per serving
    serving_size: Optional[str] = "30 g"
    servings_per_pack: Optional[str] = None
    nutrients: List[NutrientItem] = []

class DeclarationData(BaseModel):
    mrp: Optional[str] = None # e.g. "499.00"
    unit_sale_price: Optional[str] = None
    batch_number: Optional[str] = None
    mfg_date: Optional[str] = None # e.g. "09/2026"
    pack_date: Optional[str] = None
    expiry_date: Optional[str] = None
    best_before: Optional[str] = "9 Months from packaging"
    storage_instructions: Optional[str] = "Store in a cool, hygienic and dry place away from direct sunlight."
    preparation_instructions: Optional[str] = None
    user_claims: List[str] = []
    barcode: Optional[str] = None # GTIN or EAN
    qr_code_url: Optional[str] = None

class BrandIdentity(BaseModel):
    logo_url: Optional[str] = None
    use_text_logo: bool = True
    product_image_url: Optional[str] = None
    primary_color: str = "#1B4D3E" # Natural forest green
    secondary_color: str = "#F5F2EB" # Warm cream
    accent_color: str = "#D4AF37" # Warm gold / ochre
    background_style: str = "SOLID_CLEAN" # SOLID_CLEAN, DUOTONE, SOFT_TEXTURE
    typography_preference: str = "MODERN_SANS" # MODERN_SANS, ELEGANT_SERIF, CLEAN_GEOMETRIC
    design_style: str = "PREMIUM_NATURAL" # MINIMAL, PREMIUM_NATURAL, MODERN_CLEAN, TRADITIONAL, BOLD_VIBRANT
    custom_direction: Optional[str] = None

class PackagingDimensions(BaseModel):
    width_mm: float = 140.0
    height_mm: float = 210.0
    depth_mm: float = 60.0
    bleed_mm: float = 3.0
    pdp_area_sqcm: Optional[float] = None

class PackagingFormat(BaseModel):
    format_type: str = "STAND_UP_POUCH" # STAND_UP_POUCH, PILLOW_POUCH, BOX_CARTON, JAR, BOTTLE, CAN
    dimensions: PackagingDimensions = Field(default_factory=PackagingDimensions)
    active_panels: List[str] = ["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"]

class DesignBrief(BaseModel):
    summary: str
    color_palette_notes: str
    typography_notes: str
    hierarchy_notes: str
    style_keywords: List[str] = []

class PackagingProjectCreate(BaseModel):
    title: str
    packaging_format: Optional[str] = "STAND_UP_POUCH"
    dimensions: Optional[PackagingDimensions] = None
    product_data: ProductBasics
    business_data: Optional[BusinessLegal] = None
    food_data: Optional[FoodInfo] = None
    nutrition_data: Optional[NutritionData] = None
    declaration_data: Optional[DeclarationData] = None
    brand_data: Optional[BrandIdentity] = None
    custom_direction: Optional[str] = None

class PackagingProjectUpdate(BaseModel):
    title: Optional[str] = None
    packaging_format: Optional[str] = None
    dimensions: Optional[PackagingDimensions] = None
    product_data: Optional[ProductBasics] = None
    business_data: Optional[BusinessLegal] = None
    food_data: Optional[FoodInfo] = None
    nutrition_data: Optional[NutritionData] = None
    declaration_data: Optional[DeclarationData] = None
    brand_data: Optional[BrandIdentity] = None
    custom_direction: Optional[str] = None

class PackagingRedesignRequest(BaseModel):
    feedback_prompt: str = Field(..., description="Natural language redesign instructions e.g. 'Make the green lighter and increase MRP prominence'")
    target_panels: Optional[List[str]] = None

class PanelDesignElement(BaseModel):
    id: str
    element_type: str # BRAND_LOGO, PRODUCT_TITLE, DESCRIPTOR, NET_QUANTITY, NUTRITION_TABLE, INGREDIENTS, MANUFACTURER, MRP_BLOCK, DATE_BLOCK, BARCODE, VEG_ICON, CLAIM_BADGE
    text: Optional[str] = None
    source_field: str
    is_placeholder: bool = False
    x_percent: float
    y_percent: float
    width_percent: float
    height_percent: float
    font_size_pt: Optional[float] = 12.0
    font_weight: Optional[str] = "normal"
    color: Optional[str] = "#000000"
    alignment: Optional[str] = "left"

class PanelDesignLayout(BaseModel):
    panel_type: str # FRONT, BACK, LEFT, RIGHT, TOP, BOTTOM
    dimensions_mm: Dict[str, float]
    background_color: str
    elements: List[PanelDesignElement] = []
    rendered_image_url: Optional[str] = None
    is_applicable: bool = True

class PackagingProjectRead(BaseModel):
    id: str
    company_id: str
    product_id: Optional[str] = None
    artwork_id: Optional[str] = None
    artwork_version_id: Optional[str] = None
    inspection_id: Optional[str] = None
    title: str
    status: str
    packaging_format: str
    dimensions: Dict[str, Any]
    product_data: Dict[str, Any]
    business_data: Dict[str, Any]
    food_data: Dict[str, Any]
    nutrition_data: Dict[str, Any]
    declaration_data: Dict[str, Any]
    brand_data: Dict[str, Any]
    design_brief: Dict[str, Any]
    panel_designs: Dict[str, Any] # Map of panel_type to PanelDesignLayout
    active_version_number: int
    compliance_summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PackagingRedesignResponse(BaseModel):
    project_id: str
    proposed_version_number: int
    changes_summary: List[str]
    proposed_panels: Dict[str, Any]
    design_brief_update: Dict[str, Any]
