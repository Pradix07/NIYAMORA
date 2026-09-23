import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.company import Company
from app.models.packaging_project import PackagingProject
from app.models.inspection import Inspection
from app.schemas.packaging_project import (
    PackagingProjectCreate,
    PackagingProjectUpdate,
    PackagingProjectRead,
    PackagingRedesignRequest,
    PackagingRedesignResponse
)
from app.api.deps import get_current_company
from app.services.packaging_design_service import PackagingDesignService

router = APIRouter(prefix="/packaging-studio", tags=["Packaging Studio"])

@router.post("/projects", response_model=PackagingProjectRead, status_code=status.HTTP_201_CREATED)
def create_packaging_project(
    payload: PackagingProjectCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Create a new AI Packaging Studio project from wizard inputs."""
    try:
        project = PackagingDesignService.create_project(
            db=db,
            company_id=company.id,
            payload_dict=payload.model_dump()
        )
        return project
    except Exception as exc:
        import logging
        logging.getLogger("niyamora.packaging_studio").exception("Failed to create packaging project: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create packaging project: {str(exc)}"
        )

@router.get("/projects", response_model=List[PackagingProjectRead])
def list_packaging_projects(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """List all Packaging Studio projects belonging to the authenticated company."""
    projects = (
        db.query(PackagingProject)
        .filter(PackagingProject.company_id == company.id)
        .order_by(PackagingProject.updated_at.desc())
        .all()
    )
    return projects

@router.get("/projects/{project_id}", response_model=PackagingProjectRead)
def get_packaging_project(
    project_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Get project details, structured design brief, and rendered panel layouts."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")
    
    # Attach active compliance summary if inspection exists
    res = PackagingProjectRead.model_validate(project)
    if project.artwork_version_id:
        insp = (
            db.query(Inspection)
            .filter(Inspection.artwork_version_id == project.artwork_version_id)
            .order_by(Inspection.created_at.desc())
            .first()
        )
        if insp:
            res.inspection_id = insp.id
            res.compliance_summary = {
                "score": insp.compliance_score,
                "verdict": insp.compliance_verdict,
                "findings_summary": insp.findings_summary
            }
    return res

@router.put("/projects/{project_id}", response_model=PackagingProjectRead)
def update_packaging_project(
    project_id: str,
    payload: PackagingProjectUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Update project structured specifications before or after generation."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        if val is not None:
            setattr(project, field, val)

    db.commit()
    db.refresh(project)
    return project

@router.get("/projects/{project_id}/panels/{panel_type}")
def get_packaging_panel_image(
    project_id: str,
    panel_type: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Direct authenticated endpoint to fetch the generated artwork image for a specific panel.
    Works seamlessly with browser <img> tags, 2D inspector, and Three.js 3D texture loaders.
    """
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    p_type_norm = panel_type.upper()
    panel_designs = project.panel_designs or {}
    p_data = panel_designs.get(p_type_norm)
    if not p_data:
        raise HTTPException(status_code=404, detail=f"Panel '{panel_type}' not found in project")

    file_path = p_data.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Panel image file not found on disk")

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=os.path.basename(file_path)
    )


@router.post("/projects/{project_id}/generate", response_model=PackagingProjectRead)
def generate_packaging_panels(
    project_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Render 6-panel artwork, register version, and run automated compliance inspection."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    try:
        updated_project, inspection = PackagingDesignService.generate_packaging_version(
            db=db,
            project_id=project.id,
            version_number=project.active_version_number or 1
        )
        res = PackagingProjectRead.model_validate(updated_project)
        res.inspection_id = inspection.id
        res.compliance_summary = {
            "score": inspection.compliance_score,
            "verdict": inspection.compliance_verdict,
            "findings_summary": inspection.findings_summary
        }
        return res
    except Exception as exc:
        import logging
        logging.getLogger("niyamora.packaging_studio").exception("Failed to generate packaging panels: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate packaging artwork: {str(exc)}"
        )

@router.post("/projects/{project_id}/redesign", response_model=PackagingRedesignResponse)
def request_redesign_proposal(
    project_id: str,
    payload: PackagingRedesignRequest,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Propose visual/layout redesign from natural language feedback without modifying factual product data."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    proposal = PackagingDesignService.propose_redesign(
        db=db,
        project_id=project.id,
        feedback_prompt=payload.feedback_prompt
    )
    return proposal

@router.post("/projects/{project_id}/accept-redesign", response_model=PackagingProjectRead)
def accept_redesign_proposal(
    project_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Accept the proposed redesign, create V02, generate artwork panels, and execute compliance check."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    updated_project, inspection = PackagingDesignService.accept_redesign(
        db=db,
        project_id=project.id
    )
    res = PackagingProjectRead.model_validate(updated_project)
    res.inspection_id = inspection.id
    res.compliance_summary = {
        "score": inspection.compliance_score,
        "verdict": inspection.compliance_verdict,
        "findings_summary": inspection.findings_summary
    }
    return res

@router.get("/projects/{project_id}/export-pdf")
def export_packaging_pdf(
    project_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Export printable multi-panel packaging PDF with full tenant isolation."""
    project = (
        db.query(PackagingProject)
        .filter(PackagingProject.id == project_id, PackagingProject.company_id == company.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Packaging project not found")

    pdf_path = PackagingDesignService.export_packaging_pdf(
        db=db,
        project_id=project.id
    )
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Generated PDF file not found")

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
