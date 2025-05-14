/**
 * Complaint Form Handler - WCAG 2.1 AAA Compliant
 * Version: 2.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Helper Functions
    const getElement = id => document.getElementById(id);
    const getElements = selector => document.querySelectorAll(selector);
    const showElement = el => el && (el.style.display = 'block');
    const hideElement = el => el && (el.style.display = 'none');

    // Form Configuration
    const CONFIG = {
        MIN_DETAILS_LENGTH: 20,
        SUBMIT_ENDPOINT: window.complaintFormAjax?.ajaxurl || '/wp-admin/admin-ajax.php',
        REQUIRED_FIELDS: ['type', 'department', 'details'],
        PERSONAL_INFO_FIELDS: ['name', 'address', 'phone', 'email']
    };

    // Initial Data State
    let formState = {
        type: '',
        typeOther: '',
        department: '',
        details: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        isAnonymous: false,
    };

    // Accessibility helper functions
    function announceToScreenReader(message, isAlert = false) {
        const region = isAlert ? getElement('form-alert') : getElement('form-status');
        if (region) {
            region.textContent = message;
            // Clear message after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 5000);
        }
    }

    // Initialize form elements and attach event listeners
    function initForm() {
        const form = document.querySelector('#complaint-form, form.complaint-form');
        
        if (!form) {
            console.error('Complaint form not found');
            return;
        }
        
        console.log('Initializing complaint form with WCAG 2.1 AAA compliance');
        
        // ค้นหา elements ภายในฟอร์ม
        const typeSelect = form.querySelector('#type');
        const typeOtherContainer = form.querySelector('.type-other-field');
        const typeOtherInput = form.querySelector('#typeOther');
        const personalInfoSection = form.querySelector('.personal-info');
        const anonymousCheckbox = form.querySelector('#isAnonymous');
        const detailsTextarea = form.querySelector('#details');
        const detailsCount = form.querySelector('#detailsCount');
        const submitButton = form.querySelector('button[type="submit"], .btn-submit');
        const loadingDiv = form.querySelector('.loading');
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        
        // สร้าง message div หากไม่มี
        if (!messageDiv) {
            const newMessageDiv = document.createElement('div');
            newMessageDiv.id = 'form-message';
            newMessageDiv.className = 'message';
            newMessageDiv.style.display = 'none';
            newMessageDiv.setAttribute('role', 'alert');
            newMessageDiv.setAttribute('aria-live', 'polite');
            form.insertBefore(newMessageDiv, form.firstChild);
        }
        
        // ติดตั้ง event listeners
        
        // Type Select Change
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                formState.type = this.value;
                if (this.value === 'other') {
                    showElement(typeOtherContainer);
                    typeOtherContainer.setAttribute('aria-hidden', 'false');
                    if (typeOtherInput) {
                        typeOtherInput.required = true;
                        typeOtherInput.setAttribute('aria-required', 'true');
                        // Focus on the type other field for better accessibility
                        setTimeout(() => typeOtherInput.focus(), 100);
                    }
                    announceToScreenReader('ช่องกรอกประเภทอื่นๆ ปรากฏขึ้นแล้ว กรุณาระบุประเภท');
                } else {
                    hideElement(typeOtherContainer);
                    typeOtherContainer.setAttribute('aria-hidden', 'true');
                    if (typeOtherInput) {
                        typeOtherInput.required = false;
                        typeOtherInput.setAttribute('aria-required', 'false');
                        typeOtherInput.value = '';
                    }
                    formState.typeOther = '';
                }
                validateField('type');
            });
        }
        
        // Type Other Input
        if (typeOtherInput) {
            typeOtherInput.addEventListener('input', function() {
                formState.typeOther = this.value.trim();
                validateField('typeOther');
            });
        }
        
        // Anonymous Checkbox Change
        if (anonymousCheckbox) {
            anonymousCheckbox.addEventListener('change', function() {
                formState.isAnonymous = this.checked;
                if (this.checked) {
                    hideElement(personalInfoSection);
                    personalInfoSection.setAttribute('aria-hidden', 'true');
                    clearPersonalInfo();
                    // Update required attributes
                    updatePersonalInfoRequirements(false);
                    announceToScreenReader('เลือกไม่ประสงค์ออกนาม ข้อมูลส่วนตัวจะถูกซ่อน');
                } else {
                    showElement(personalInfoSection);
                    personalInfoSection.setAttribute('aria-hidden', 'false');
                    updatePersonalInfoRequirements(true);
                    announceToScreenReader('ยกเลิกการไม่ประสงค์ออกนาม กรุณากรอกข้อมูลส่วนตัว');
                    // Focus on first required field
                    setTimeout(() => {
                        const nameInput = form.querySelector('#name');
                        if (nameInput) nameInput.focus();
                    }, 100);
                }
                validateForm();
            });
        }
        
        // Details Character Count
        if (detailsTextarea && detailsCount) {
            detailsTextarea.addEventListener('input', function() {
                const count = this.value.length;
                detailsCount.textContent = count;
                formState.details = this.value;
                
                if (count > 2000) {
                    this.value = this.value.substring(0, 2000);
                    formState.details = this.value;
                    announceToScreenReader('ถึงจำนวนอักขระสูงสุด 2000 ตัวแล้ว', true);
                }
                
                // Announce character count at milestones
                if (count === 500 || count === 1000 || count === 1500 || count === 1900) {
                    announceToScreenReader(`พิมพ์ไปแล้ว ${count} จาก 2000 ตัวอักษร`);
                }
                
                validateField('details');
            });
        } else if (detailsTextarea) {
            detailsTextarea.addEventListener('input', function() {
                formState.details = this.value;
                validateField('details');
            });
        }
        
        // Department Input
        const departmentInput = form.querySelector('#department');
        if (departmentInput) {
            departmentInput.addEventListener('input', function() {
                formState.department = this.value.trim();
                validateField('department');
            });
        }
        
        // Name Input
        const nameInput = form.querySelector('#name');
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                formState.name = this.value.trim();
                validateField('name');
            });
        }
        
        // Address Textarea
        const addressTextarea = form.querySelector('#address');
        if (addressTextarea) {
            addressTextarea.addEventListener('input', function() {
                formState.address = this.value.trim();
            });
        }
        
        // Phone Input
        const phoneInput = form.querySelector('#phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                // อนุญาตเฉพาะตัวเลข
                const newValue = this.value.replace(/[^0-9]/g, '');
                if (newValue !== this.value) {
                    this.value = newValue;
                    announceToScreenReader('กรุณาใส่เฉพาะตัวเลขเท่านั้น', true);
                }
                formState.phone = newValue;
                validateField('phone');
            });
        }
        
        // Email Input
        const emailInput = form.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                formState.email = this.value.trim();
                validateField('email');
            });
        }
        
        // Form Submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSubmit(e);
        });
        
        // Modal Event Listeners
        const modal = getElement('complaint-success-modal');
        const modalClose = modal?.querySelector('.modal-close');
        const btnCloseModal = modal?.querySelector('.btn-close-modal');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => closeModal());
        }
        
        if (btnCloseModal) {
            btnCloseModal.addEventListener('click', () => closeModal());
        }
        
        // Close modal on clicking outside
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            // Add keyboard event for modal
            modal.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });
        }
        
        // Add keyboard navigation support for the entire form
        form.addEventListener('keydown', function(e) {
            // Press Enter to submit when on submit button
            if (e.key === 'Enter' && e.target === submitButton) {
                e.preventDefault();
                handleSubmit(e);
            }
        });
        
        // Initialize focus management
        initializeFocusManagement();
        
        console.log('Event listeners set up successfully with WCAG compliance');
    }

    // Update personal info requirements based on anonymous status
    function updatePersonalInfoRequirements(isRequired) {
        const nameInput = getElement('name');
        const phoneInput = getElement('phone');
        const emailInput = getElement('email');
        
        if (nameInput) {
            nameInput.required = isRequired;
            nameInput.setAttribute('aria-required', isRequired ? 'true' : 'false');
        }
        
        if (phoneInput) {
            phoneInput.setAttribute('aria-required', isRequired ? 'true' : 'false');
        }
        
        if (emailInput) {
            emailInput.setAttribute('aria-required', isRequired ? 'true' : 'false');
        }
    }

    // Initialize focus management for better keyboard navigation
    function initializeFocusManagement() {
        const form = document.querySelector('#complaint-form, form.complaint-form');
        if (!form) return;
        
        // Get all focusable elements
        const focusableElements = form.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), ' +
            'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            // Add visual focus indicators
            focusableElements.forEach(el => {
                el.addEventListener('focus', function() {
                    this.classList.add('has-visible-focus');
                });
                
                el.addEventListener('blur', function() {
                    this.classList.remove('has-visible-focus');
                });
            });
        }
    }

    // Field Validation
    function validateField(fieldName) {
        const errors = {};
        
        switch(fieldName) {
            case 'type':
                if (!formState.type) {
                    errors.type = 'กรุณาเลือกประเภทเรื่องร้องเรียน';
                } else if (formState.type === 'other' && !formState.typeOther) {
                    errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
                }
                break;
                
            case 'typeOther':
                if (formState.type === 'other' && !formState.typeOther) {
                    errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
                }
                break;
                
            case 'department':
                if (!formState.department) {
                    errors.department = 'กรุณาระบุหน่วยงานที่ถูกร้องเรียน';
                }
                break;
                
            case 'details':
                if (!formState.details) {
                    errors.details = 'กรุณาระบุรายละเอียด';
                } else if (formState.details.length < CONFIG.MIN_DETAILS_LENGTH) {
                    errors.details = `กรุณาระบุรายละเอียดอย่างน้อย ${CONFIG.MIN_DETAILS_LENGTH} ตัวอักษร`;
                }
                break;
                
            case 'name':
                if (!formState.isAnonymous && !formState.name) {
                    errors.name = 'กรุณาระบุชื่อ-นามสกุล';
                }
                break;
                
            case 'email':
                if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
                    errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
                }
                break;
                
            case 'phone':
                if (formState.phone && !/^[0-9]{9,10}$/.test(formState.phone)) {
                    errors.phone = 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)';
                }
                break;
        }

        // ตรวจสอบว่าต้องระบุช่องทางติดต่ออย่างน้อย 1 ช่องทาง
        if (!formState.isAnonymous && (fieldName === 'phone' || fieldName === 'email')) {
            if (!formState.phone && !formState.email) {
                errors.contact = 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมล อย่างน้อย 1 ช่องทาง';
            } else {
                // ลบข้อความแจ้งเตือนเกี่ยวกับข้อมูลติดต่อหากมีการระบุ
                const contactError = getElement('contact-error');
                if (contactError) {
                    contactError.textContent = '';
                    contactError.setAttribute('aria-hidden', 'true');
                }
            }
        }

        displayErrors(errors);
        return Object.keys(errors).length === 0;
    }

    // Display form errors
    function displayErrors(errors) {
        // ล้างข้อความผิดพลาดเดิม
        getElements('.error-message').forEach(span => {
            span.textContent = '';
            span.setAttribute('aria-hidden', 'true');
        });

        // แสดงข้อความผิดพลาดที่พบ
        Object.entries(errors).forEach(([key, message]) => {
            const errorSpan = getElement(`${key}-error`);
            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.setAttribute('aria-hidden', 'false');
                
                // Update aria-invalid on associated field
                const field = getElement(key);
                if (field) {
                    field.setAttribute('aria-invalid', 'true');
                }
            }
        });
        
        // Clear aria-invalid from fields without errors
        const allFields = ['type', 'typeOther', 'department', 'details', 'name', 'phone', 'email'];
        allFields.forEach(fieldName => {
            if (!errors[fieldName]) {
                const field = getElement(fieldName);
                if (field) {
                    field.setAttribute('aria-invalid', 'false');
                }
            }
        });
    }

    // Validate entire form
    function validateForm() {
        let isValid = true;
        let errors = {};
        let firstErrorField = null;
        
        // ตรวจสอบฟิลด์ที่จำเป็น
        CONFIG.REQUIRED_FIELDS.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = getElement(field);
                }
            }
        });
        
        // ตรวจสอบข้อมูลส่วนตัว (ถ้าไม่ใช่การร้องเรียนแบบไม่ระบุตัวตน)
        if (!formState.isAnonymous) {
            if (!formState.name) {
                errors.name = 'กรุณาระบุชื่อ-นามสกุล';
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = getElement('name');
                }
            }
            
            if (!formState.phone && !formState.email) {
                errors.contact = 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมล อย่างน้อย 1 ช่องทาง';
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = getElement('phone');
                }
            }
        }
        
        // ตรวจสอบประเภทอื่นๆ
        if (formState.type === 'other' && !formState.typeOther) {
            errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
            isValid = false;
            if (!firstErrorField) {
                firstErrorField = getElement('typeOther');
            }
        }
        
        displayErrors(errors);

        if (!isValid) {
            // แจ้งข้อผิดพลาดให้ screen reader ทราบ
            const errorCount = Object.keys(errors).length;
            announceToScreenReader(`พบข้อผิดพลาด ${errorCount} รายการ กรุณาตรวจสอบและแก้ไข`, true);
            
            // Focus on first error field
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    }

    // Clear personal information fields
    function clearPersonalInfo() {
        CONFIG.PERSONAL_INFO_FIELDS.forEach(field => {
            const element = getElement(field);
            if (element) {
                element.value = '';
                formState[field] = '';
                element.setAttribute('aria-invalid', 'false');
            }
        });
        
        // ล้างข้อความผิดพลาดที่เกี่ยวข้อง
        const errorIds = ['name-error', 'phone-error', 'email-error', 'contact-error'];
        errorIds.forEach(id => {
            const errorEl = getElement(id);
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Reset form to initial state
    function resetForm() {
        const form = document.querySelector('#complaint-form, form.complaint-form');
        if (!form) return;

        // รีเซ็ตฟอร์มและข้อมูล
        form.reset();
        formState = {
            type: '',
            typeOther: '',
            department: '',
            details: '',
            name: '',
            address: '',
            phone: '',
            email: '',
            isAnonymous: false
        };

        // คืนค่า UI กลับสู่สถานะเริ่มต้น
        const typeOtherContainer = form.querySelector('.type-other-field');
        if (typeOtherContainer) {
            hideElement(typeOtherContainer);
            typeOtherContainer.setAttribute('aria-hidden', 'true');
        }
        
        const personalInfoSection = form.querySelector('.personal-info');
        if (personalInfoSection) {
            showElement(personalInfoSection);
            personalInfoSection.setAttribute('aria-hidden', 'false');
        }
        
        // Reset aria-invalid attributes
        const allFields = form.querySelectorAll('input, select, textarea');
        allFields.forEach(field => {
            field.setAttribute('aria-invalid', 'false');
        });
        
        // ล้างข้อความผิดพลาด
        getElements('.error-message').forEach(span => {
            span.textContent = '';
            span.setAttribute('aria-hidden', 'true');
        });

        // รีเซ็ตตัวนับตัวอักษร
        const detailsCount = getElement('detailsCount');
        if (detailsCount) {
            detailsCount.textContent = '0';
        }

        // ล้างข้อความแจ้งเตือน
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        if (messageDiv) {
            hideElement(messageDiv);
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }
        
        // Update personal info requirements
        updatePersonalInfoRequirements(true);
        
        // Announce form reset to screen reader
        announceToScreenReader('ฟอร์มถูกรีเซ็ตเรียบร้อยแล้ว');
    }

    // Show Modal with complaint details
    function showModal(data) {
        const modal = getElement('complaint-success-modal');
        const modalDetails = getElement('modal-details');
        
        if (!modal || !modalDetails) return;
        
        // สร้างเนื้อหาสำหรับ modal
        const detailsHtml = `
            <div class="modal-details" role="region" aria-label="รายละเอียดเรื่องร้องเรียน">
                <div class="detail-row">
                    <span class="detail-label">เลขที่เรื่องร้องเรียน:</span>
                    <span class="detail-value">${data.ref_number}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">วันที่ร้องเรียน:</span>
                    <span class="detail-value">${data.complaint_date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ประเภทเรื่องร้องเรียน:</span>
                    <span class="detail-value">${data.complaint_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">หน่วยงานที่ถูกร้องเรียน:</span>
                    <span class="detail-value">${data.department}</span>
                </div>
            </div>
        `;
        
        modalDetails.innerHTML = detailsHtml;
        showElement(modal);
        
        // Focus management for modal
        const modalContainer = modal.querySelector('.modal-container');
        const closeButton = modal.querySelector('.btn-close-modal');
        
        // Store last focused element
        const lastFocusedElement = document.activeElement;
        
        // Focus on close button when modal opens
        if (closeButton) {
            closeButton.focus();
        }
        
        // Trap focus within modal
        modalContainer.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const focusableModalElements = modal.querySelectorAll(
                    'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                
                const firstFocusableElement = focusableModalElements[0];
                const lastFocusableElement = focusableModalElements[focusableModalElements.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        e.preventDefault();
                        lastFocusableElement.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        e.preventDefault();
                        firstFocusableElement.focus();
                    }
                }
            }
        });
        
        // Restore focus when modal closes
        modal.dataset.lastFocusedElement = lastFocusedElement;
        
        // Announce modal opening to screen reader
        announceToScreenReader('บันทึกเรื่องร้องเรียนสำเร็จ หน้าต่างแสดงรายละเอียดเปิดขึ้นแล้ว');
    }

    // Close Modal
    function closeModal() {
        const modal = getElement('complaint-success-modal');
        if (modal) {
            hideElement(modal);
            
            // Restore focus to last focused element
            if (modal.dataset.lastFocusedElement) {
                const lastFocusedElement = document.querySelector(modal.dataset.lastFocusedElement);
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                }
            }
            
            resetForm();
            
            // Announce modal closing to screen reader
            announceToScreenReader('หน้าต่างข้อความถูกปิดแล้ว ฟอร์มถูกรีเซ็ต');
        }
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"], .btn-submit');
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        const loadingDiv = form.querySelector('.loading');
        
        // ตรวจสอบความถูกต้องของฟอร์ม
        if (!validateForm()) {
            console.error('Form validation failed');
            return;
        }

        try {
            // อัพเดต UI เพื่อแสดงสถานะกำลังส่งข้อมูล
            submitButton.disabled = true;
            submitButton.setAttribute('aria-busy', 'true');
            if (loadingDiv) {
                showElement(loadingDiv);
                loadingDiv.setAttribute('aria-hidden', 'false');
            }
            showElement(messageDiv);
            messageDiv.className = 'message info';
            messageDiv.textContent = 'กำลังดำเนินการ...';
            announceToScreenReader('กำลังส่งเรื่องร้องเรียน กรุณารอสักครู่');

            console.log('Submitting complaint form...');

            // ตรวจสอบการตั้งค่า AJAX
            if (!window.complaintFormAjax?.ajaxurl || !window.complaintFormAjax?.nonce) {
                console.error('AJAX configuration missing:', window.complaintFormAjax);
                throw new Error('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บและลองใหม่อีกครั้ง');
            }
            
            // เตรียมข้อมูลสำหรับส่ง
            const submissionData = {
                ...formState,
                timestamp: new Date().toISOString()
            };

            console.log('Sending data:', { 
                action: 'submit_complaint',
                data: submissionData 
            });

            // ส่งข้อมูลผ่าน AJAX
            const response = await fetch(CONFIG.SUBMIT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'submit_complaint',
                    nonce: window.complaintFormAjax.nonce,
                    data: JSON.stringify(submissionData)
                })
            });

            // ตรวจสอบสถานะการตอบกลับ
            if (!response.ok) {
                throw new Error(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${response.status}`);
            }

            // แปลงข้อมูลการตอบกลับเป็น JSON
            const result = await response.json();
            console.log('Server response:', result);
            
            if (result.success) {
                // ซ่อนข้อความแจ้งเตือน
                hideElement(messageDiv);
                
                // แสดง Modal พร้อมข้อมูลเรื่องร้องเรียน
                showModal(result.data);
                
                // Announce success to screen reader
                announceToScreenReader('ส่งเรื่องร้องเรียนสำเร็จ กรุณาดูรายละเอียดในหน้าต่างที่เปิดขึ้น');
                
            } else {
                // แสดงข้อความเมื่อเกิดข้อผิดพลาด
                throw new Error(result.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            messageDiv.className = 'message error';
            messageDiv.textContent = error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง';
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            announceToScreenReader(error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล', true);

        } finally {
            // คืนสถานะ UI หลังจากส่งข้อมูล
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.setAttribute('aria-busy', 'false');
            }
            if (loadingDiv) {
                hideElement(loadingDiv);
                loadingDiv.setAttribute('aria-hidden', 'true');
            }
        }
    }

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            resetForm();
        }
    });

    // Initialize form
    try {
        console.log('Initializing complaint form system - WCAG 2.1 AAA version');
        initForm();
        announceToScreenReader('ฟอร์มร้องเรียนพร้อมใช้งาน');
    } catch (error) {
        console.error('Form initialization error:', error);
        // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
        const container = document.querySelector('.complaint-form-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" role="alert">
                    <p>เกิดข้อผิดพลาดในการโหลดแบบฟอร์ม กรุณารีเฟรชหน้าเว็บ</p>
                    <button onclick="location.reload()" class="retry-button" aria-label="โหลดหน้าเว็บใหม่">
                        ลองใหม่อีกครั้ง
                    </button>
                </div>
            `;
            announceToScreenReader('เกิดข้อผิดพลาดในการโหลดแบบฟอร์ม กรุณารีเฟรชหน้าเว็บ', true);
        }
    }
});