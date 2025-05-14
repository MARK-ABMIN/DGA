/**
 * CKAN Metadata Fields Admin JavaScript
 * สำหรับผู้ดูแลระบบเพื่อแก้ไขข้อมูล
 * Version: 1.0.3
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!ckanMetafieldAdmin.isAdmin) {
        return;
    }
    
    // ตัวแปรสำหรับเก็บข้อมูลโพสต์
    const postId = $('.ckan-metadata-container').data('post-id');
    
    // เริ่มต้นการทำงาน Editor
    function initEditor() {
        // เพิ่ม event listener สำหรับไอคอนแก้ไข
        $('.ckan-edit-icon').on('click', function() {
            const row = $(this).closest('.ckan-metadata-row');
            
            // หยุดหากกำลังแก้ไขแถวอื่นอยู่
            if ($('.ckan-metadata-row.editing').length > 0 && !row.hasClass('editing')) {
                alert('กรุณาบันทึกหรือยกเลิกการแก้ไขที่กำลังดำเนินการก่อน');
                return;
            }
            
            // เปลี่ยนโหมดเป็นการแก้ไข
            startEditing(row);
        });

        // เพิ่ม event สำหรับปุ่มอัพเดต API
        $('.ckan-api-update-btn').on('click', function() {
            updateAPI();
        });

        // เพิ่ม event สำหรับปุ่มทดสอบ API
        $('.ckan-api-test-btn').on('click', function() {
            // เรียกใช้ฟังก์ชันอัพเดต API โดยส่งพารามิเตอร์ testMode = true
            updateAPI(true);
        });

        // เพิ่ม event สำหรับปุ่มส่งออก CSV
        $('.ckan-csv-export-btn').on('click', function() {
            exportCSV();
        });

        // เพิ่ม event สำหรับปุ่มปิด JSON response
        $('.ckan-close-json-btn').on('click', function() {
            $('.ckan-api-response-container').slideUp(300);
        });

        // เพิ่ม event สำหรับไอคอนตั้งค่า API Endpoint
        $('.ckan-settings-link').on('click', function(e) {
            e.preventDefault();
            $('#ckan-endpoint-modal').fadeIn(300);
        });

        // เพิ่ม event สำหรับปุ่มปิด modal
        $('.ckan-modal-close, .ckan-cancel-endpoint-btn').on('click', function() {
            $('#ckan-endpoint-modal').fadeOut(300);
        });

        // เพิ่ม event สำหรับปุ่มบันทึก endpoint
        $('.ckan-save-endpoint-btn').on('click', function() {
            saveEndpoint();
        });
        
        // ปิด modal เมื่อคลิกพื้นหลัง
        $(window).on('click', function(e) {
            if ($(e.target).hasClass('ckan-modal')) {
                $('#ckan-endpoint-modal').fadeOut(300);
            }
        });
    }
    
    // เริ่มการแก้ไขในแถวที่กำหนด
    function startEditing(row) {
        // เก็บข้อมูลที่จำเป็น
        const fieldName = row.data('field');
        const fieldType = row.data('type');
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value');
        
        // เพิ่ม class ให้รู้ว่ากำลังแก้ไข
        row.addClass('editing');
        
        // สร้าง form ตามประเภทของข้อมูล
        let editorHtml = '<div class="ckan-field-editor">';
        
        switch (fieldType) {
            case 'boolean':
                // Checkbox สำหรับข้อมูล boolean
                const isChecked = (originalValue === true || originalValue === 1 || originalValue === '1' || 
                                  originalValue === 'true' || originalValue === 'yes') ? 'checked' : '';
                editorHtml += `<label><input type="checkbox" ${isChecked} /> ใช่</label>`;
                break;
                
            case 'text':
                // Input สำหรับข้อความทั่วไป
                editorHtml += `<input type="text" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'email':
                // Input สำหรับอีเมล
                editorHtml += `<input type="email" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'url':
                // Input สำหรับ URL
                editorHtml += `<input type="url" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'date':
                // Input สำหรับวันที่
                let dateValue = originalValue;
                if (dateValue && !isNaN(dateValue)) {
                    // แปลง timestamp เป็นรูปแบบ yyyy-mm-dd
                    const date = new Date(parseInt(dateValue) * 1000);
                    dateValue = date.toISOString().split('T')[0];
                }
                editorHtml += `<input type="date" value="${escapeHtml(dateValue || '')}" />`;
                break;
                
            case 'datetime':
                // Input สำหรับวันที่และเวลา
                let datetimeValue = originalValue;
                if (datetimeValue && !isNaN(datetimeValue)) {
                    // แปลง timestamp เป็นรูปแบบ yyyy-mm-ddThh:mm
                    const datetime = new Date(parseInt(datetimeValue) * 1000);
                    datetimeValue = datetime.toISOString().slice(0, 16);
                }
                editorHtml += `<input type="datetime-local" value="${escapeHtml(datetimeValue || '')}" />`;
                break;
                
            default:
                // ข้อความทั่วไปสำหรับประเภทที่ไม่รองรับ
                editorHtml += `<textarea rows="3">${escapeHtml(originalValue || '')}</textarea>`;
        }
        
        // เพิ่มปุ่มบันทึกและยกเลิก
        editorHtml += `
            <div class="ckan-edit-actions">
                <button class="ckan-edit-btn ckan-save-btn">${ckanMetafieldAdmin.saveText}</button>
                <button class="ckan-edit-btn ckan-cancel-btn">${ckanMetafieldAdmin.cancelText}</button>
            </div>
            <div class="ckan-status-message" style="display:none;"></div>
        </div>`;
        
        // แทนที่เนื้อหาเดิมด้วย editor
        valueCell.html(editorHtml);
        
        // โฟกัสที่ input แรก
        valueCell.find('input, textarea').first().focus();
        
        // เพิ่ม event listener สำหรับปุ่มบันทึกและยกเลิก
        valueCell.find('.ckan-save-btn').on('click', function() {
            saveField(row, fieldName, fieldType);
        });
        
        valueCell.find('.ckan-cancel-btn').on('click', function() {
            cancelEditing(row);
        });
    }
    
    // บันทึกข้อมูลที่แก้ไข
    function saveField(row, fieldName, fieldType) {
        const valueCell = row.find('.ckan-metadata-value');
        const statusMessage = valueCell.find('.ckan-status-message');
        let fieldValue;
        
        // ดึงค่าจาก input ตามประเภท
        switch (fieldType) {
            case 'boolean':
                fieldValue = valueCell.find('input[type="checkbox"]').is(':checked') ? true : false;
                break;
            case 'text':
            case 'email':
            case 'url':
                fieldValue = valueCell.find('input').val();
                break;
            case 'date':
            case 'datetime':
                fieldValue = valueCell.find('input').val();
                break;
            default:
                fieldValue = valueCell.find('textarea').val();
        }
        
        // แสดงสถานะกำลังบันทึก
        statusMessage.html(ckanMetafieldAdmin.editingText)
            .removeClass('ckan-status-success ckan-status-error')
            .addClass('ckan-status-saving')
            .show();
        
        // ส่งข้อมูลไปยัง server ด้วย AJAX
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'ckan_update_field',
                nonce: ckanMetafieldAdmin.nonce,
                post_id: postId,
                field_name: fieldName,
                field_value: fieldValue,
                field_type: fieldType
            },
            success: function(response) {
                if (response.success) {
                    // อัปเดตค่าใน data attribute
                    valueCell.data('original-value', response.data.raw_value);
                    
                    // แสดงค่าที่ถูกจัดรูปแบบ
                    valueCell.html(response.data.formatted_value);
                    
                    // แสดงข้อความสำเร็จและซ่อนหลังจาก 2 วินาที
                    valueCell.append(`<div class="ckan-status-message ckan-status-success">${ckanMetafieldAdmin.successText}</div>`);
                    setTimeout(function() {
                        valueCell.find('.ckan-status-message').fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 2000);
                    
                    // ลบ class editing
                    row.removeClass('editing');
                } else {
                    // แสดงข้อความผิดพลาด
                    statusMessage.html(response.data || ckanMetafieldAdmin.errorText)
                        .removeClass('ckan-status-saving')
                        .addClass('ckan-status-error');
                }
            },
            error: function() {
                // แสดงข้อความผิดพลาด
                statusMessage.html(ckanMetafieldAdmin.errorText)
                    .removeClass('ckan-status-saving')
                    .addClass('ckan-status-error');
            }
        });
    }
    
    // ยกเลิกการแก้ไข
    function cancelEditing(row) {
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value');
        const fieldType = row.data('type');
        
        // แสดงค่าเดิม
        valueCell.html(formatValue(originalValue, fieldType));
        
        // ลบ class editing
        row.removeClass('editing');
    }
    
    // จัดรูปแบบข้อมูลสำหรับการแสดงผล (simplified version)
    function formatValue(value, type) {
        if (value === null || value === undefined || value === '') {
            return '<span class="ckan-empty-value">ไม่มีข้อมูล</span>';
        }
        
        switch (type) {
            case 'boolean':
                if (value === true || value === 1 || value === '1' || value === 'true' || value === 'yes') {
                    return '<span class="boolean-true">ใช่</span>';
                } else {
                    return '<span class="boolean-false">ไม่ใช่</span>';
                }
                
            case 'email':
                return '<a href="mailto:' + escapeHtml(value) + '">' + escapeHtml(value) + '</a>';
                
            case 'url':
                let displayUrl = escapeHtml(value);
                if (displayUrl.length > 50) {
                    displayUrl = displayUrl.substring(0, 47) + '...';
                }
                return '<a href="' + escapeHtml(value) + '" target="_blank" title="' + escapeHtml(value) + '">' + displayUrl + '</a>';
                
            default:
                return escapeHtml(value);
        }
    }
    
    /**
     * ฟังก์ชันบันทึก API Endpoint
     */
    function saveEndpoint() {
        const endpointInput = $('#ckan-endpoint-url');
        const endpoint = endpointInput.val().trim();
        const statusEl = $('.ckan-endpoint-status');
        
        // แสดงสถานะกำลังบันทึก
        statusEl.html(ckanMetafieldAdmin.endpointSavingText)
            .removeClass('ckan-status-success ckan-status-error')
            .addClass('ckan-status-saving')
            .fadeIn(300);
        
        // ส่งข้อมูลไปยัง server ด้วย AJAX
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'ckan_save_endpoint',
                nonce: ckanMetafieldAdmin.nonce,
                post_id: postId,
                endpoint: endpoint
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดต data-endpoint ของปุ่ม
                    $('.ckan-api-update-btn').data('endpoint', response.data.endpoint);
                    
                    // แสดงข้อความสำเร็จ
                    statusEl.html(ckanMetafieldAdmin.endpointSavedText)
                        .removeClass('ckan-status-saving')
                        .addClass('ckan-status-success');
                    
                    // ปิด modal หลังจาก 1.5 วินาที
                    setTimeout(function() {
                        $('#ckan-endpoint-modal').fadeOut(300);
                        statusEl.fadeOut(300);
                    }, 1500);
                } else {
                    // แสดงข้อความผิดพลาด
                    statusEl.html(response.data || ckanMetafieldAdmin.errorText)
                        .removeClass('ckan-status-saving')
                        .addClass('ckan-status-error');
                }
            },
            error: function() {
                // แสดงข้อความผิดพลาด
                statusEl.html(ckanMetafieldAdmin.errorText)
                    .removeClass('ckan-status-saving')
                    .addClass('ckan-status-error');
            }
        });
    }
    
    /**
     * ฟังก์ชันรวบรวมข้อมูลจาก metadata fields ทั้งหมด
     */
    function collectMetadataFields() {
        return new Promise((resolve, reject) => {
            const data = {
                post_id: postId,
                post_title: $('h1.entry-title').text() || document.title,
                post_url: window.location.href,
                metadata: {},
                taxonomies: {}, // ส่วนของ taxonomies
                assets: [] // เพิ่มส่วนของ assets
            };
            
            // รวบรวมข้อมูลจากทุกแถว
            $('.ckan-metadata-row').each(function() {
                const row = $(this);
                const fieldName = row.data('field');
                const fieldType = row.data('type');
                const valueCell = row.find('.ckan-metadata-value');
                const label = row.find('.ckan-metadata-label').text().replace(/\s*แก้ไข\s*$/, '').trim();
                
                // ดึงค่าจาก data attribute (ค่าที่เก็บใน database)
                let fieldValue = valueCell.data('original-value');
                
                data.metadata[fieldName] = {
                    label: label,
                    value: fieldValue,
                    type: fieldType
                };
            });
            
            // สร้าง Promise array สำหรับการดึงข้อมูลทั้ง taxonomies และ assets
            const promises = [
                // Promise สำหรับดึงข้อมูล taxonomies
                new Promise((resolveInner, rejectInner) => {
                    $.ajax({
                        url: ckanMetafieldAdmin.ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'ckan_get_assets',
                            nonce: ckanMetafieldAdmin.nonce,
                            post_id: postId
                        },
                        success: function(response) {
                            if (response.success) {
                                // เปลี่ยนจาก response.data เป็น response.data.assets
                                data.assets = response.data.assets || [];
                                
                                // เพิ่มข้อมูล debug สำหรับตรวจสอบ
                                console.log('Assets debug info:', response.data.debug_info);
                                
                                resolveInner();
                            } else {
                                console.error('Error fetching assets:', response);
                                data.assets = [];
                                resolveInner();
                            }
                        },
                        error: function(error) {
                            console.error('Error fetching assets:', error);
                            data.assets = [];
                            resolveInner();
                        }
                    });
                }),
                
                // Promise สำหรับดึงข้อมูล assets จาก repeater field
                new Promise((resolveInner, rejectInner) => {
                    $.ajax({
                        url: ckanMetafieldAdmin.ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'ckan_get_assets',
                            nonce: ckanMetafieldAdmin.nonce,
                            post_id: postId
                        },
                        success: function(response) {
                            if (response.success) {
                                data.assets = response.data;
                                resolveInner();
                            } else {
                                console.error('Error fetching assets:', response);
                                resolveInner(); // ยังคง resolve แม้จะมีข้อผิดพลาด
                            }
                        },
                        error: function(error) {
                            console.error('Error fetching assets:', error);
                            resolveInner(); // ยังคง resolve แม้จะมีข้อผิดพลาด
                        }
                    });
                })
            ];
            
            // รอให้ทุก Promise เสร็จสิ้น
            Promise.all(promises)
                .then(() => {
                    resolve(data);
                })
                .catch(error => {
                    console.error('Error collecting metadata:', error);
                    resolve(data); // ยังคง resolve ด้วยข้อมูลที่มี แม้จะมีข้อผิดพลาด
                });
        });
    }

    /**
     * ฟังก์ชันสำหรับอัพเดตข้อมูลไปยัง API
     * @param {boolean} testMode - โหมดทดสอบ (ไม่ส่งข้อมูลจริง)
     */
    function updateAPI(testMode = false) {
        // ดึง endpoint จากปุ่ม
        let endpoint = $('.ckan-api-update-btn').data('endpoint');
        const responseContainer = $('.ckan-api-response-container');
        const responseJson = $('.ckan-api-response-json');
        
        // ตรวจสอบว่าเป็นโหมดทดสอบหรือไม่
        if (testMode) {
            // ในโหมดทดสอบ ไม่ต้องตรวจสอบ endpoint
            responseJson.html('กำลังทดสอบการรวบรวมข้อมูล...');
            responseContainer.slideDown(300);
            
            // รวบรวมข้อมูลจาก field ทั้งหมดโดยใช้ Promise
            collectMetadataFields()
                .then(data => {
                    // แสดงข้อมูลที่จะส่ง
                    responseJson.html(`
                        <div class="ckan-api-success-message">ทดสอบการรวบรวมข้อมูลสำเร็จ (ไม่มีการส่งข้อมูลจริง)</div>
                        <div class="ckan-api-content">
                            <h4>ข้อมูลที่จะส่ง:</h4>
                            <pre class="ckan-sent-data">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
                        </div>
                    `);
                });
            
            return;
        }

        // เพิ่มข้อมูล assets ใน CSV
        if (data.assets && data.assets.length > 0) {
            csvData.push([]);  // เพิ่มบรรทัดว่าง
            csvData.push(['Asset Name', 'Asset Description', 'Asset Link']);
            
            data.assets.forEach(asset => {
                csvData.push([
                    asset.name || '',
                    asset.description || '',
                    asset.link || ''
                ]);
            });
        } else {
            csvData.push([]);  // เพิ่มบรรทัดว่าง
            csvData.push(['Asset Name', 'Asset Description', 'Asset Link']);
            csvData.push(['ไม่มีข้อมูลไฟล์', '', '']);
        }
        
        // ตรวจสอบว่ามีการระบุ endpoint หรือไม่
        if (!endpoint) {
            alert(ckanMetafieldAdmin.endpointEmptyText);
            return;
        }
        
        // แสดงข้อความกำลังอัพเดต
        responseJson.html(ckanMetafieldAdmin.apiUpdateText);
        responseContainer.slideDown(300);
        
        // รวบรวมข้อมูลจาก field ทั้งหมดโดยใช้ Promise
        collectMetadataFields()
            .then(data => {
                // ส่งข้อมูลไปยัง server ด้วย AJAX
                $.ajax({
                    url: ckanMetafieldAdmin.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'ckan_update_api',
                        nonce: ckanMetafieldAdmin.nonce,
                        post_id: postId,
                        endpoint: endpoint,
                        data: JSON.stringify(data)
                    },
                    success: function(response) {
                        if (response.success) {
                            // แสดงผลลัพธ์สำเร็จ
                            const sentData = JSON.stringify(response.data.sent_data, null, 2);
                            const apiResponse = response.data.response ? JSON.stringify(JSON.parse(response.data.response), null, 2) : 'No response from API';
                            
                            responseJson.html(`
                                <div class="ckan-api-success-message">${ckanMetafieldAdmin.apiSuccessText}</div>
                                <div class="ckan-api-content">
                                    <h4>ข้อมูลที่ส่ง:</h4>
                                    <pre class="ckan-sent-data">${escapeHtml(sentData)}</pre>
                                    
                                    <h4>การตอบกลับจาก API:</h4>
                                    <pre class="ckan-api-response">${escapeHtml(apiResponse)}</pre>
                                </div>
                            `);
                        } else {
                            // แสดงข้อความผิดพลาด
                            let errorMessage = response.data.message || ckanMetafieldAdmin.apiErrorText;
                            let sentData = '';
                            
                            if (response.data.sent_data) {
                                sentData = `
                                    <h4>ข้อมูลที่พยายามส่ง:</h4>
                                    <pre class="ckan-sent-data">${escapeHtml(JSON.stringify(response.data.sent_data, null, 2))}</pre>
                                `;
                            }
                            
                            responseJson.html(`
                                <div class="ckan-api-error-message">${errorMessage}</div>
                                ${sentData}
                            `);
                        }
                    },
                    error: function() {
                        // แสดงข้อความผิดพลาด
                        responseJson.html(`
                            <div class="ckan-api-error-message">${ckanMetafieldAdmin.apiErrorText}</div>
                        `);
                    }
                });
            });
    }
    
    /**
 * ฟังก์ชันสำหรับส่งออกข้อมูลเป็น CSV
 */
function exportCSV() {
    // แสดงข้อความกำลังทำงาน
    const loadingDialog = $('<div class="ckan-loading-dialog">' + ckanMetafieldAdmin.exportCsvText + '</div>');
    $('body').append(loadingDialog);
    
    try {
        // รวบรวมข้อมูลจาก field ทั้งหมดโดยใช้ Promise
        collectMetadataFields()
            .then(data => {
                // สร้างข้อมูล CSV
                const csvData = [];
                
                // ส่วนที่ 1: ข้อมูล Metadata พื้นฐาน
                csvData.push(['=== ข้อมูลทั่วไป ===']);
                csvData.push(['Post ID', data.post_id]);
                csvData.push(['ชื่อเรื่อง', data.post_title]);
                csvData.push(['URL', data.post_url]);
                csvData.push([]);  // บรรทัดว่าง
                
                // ส่วนที่ 2: Metadata fields
                csvData.push(['=== รายละเอียดข้อมูล ===']);
                csvData.push(['Field ID', 'Field Label', 'Field Value', 'Field Type']);
                
                // นำข้อมูลจาก metadata มาใส่ใน CSV
                if (data.metadata) {
                    Object.keys(data.metadata).forEach(fieldId => {
                        const field = data.metadata[fieldId];
                        let fieldValue = field.value;
                        
                        // แปลงค่า boolean เป็นข้อความ
                        if (field.type === 'boolean') {
                            fieldValue = (fieldValue === true || fieldValue === 1 || fieldValue === '1' || 
                                        String(fieldValue).toLowerCase() === 'true' || String(fieldValue).toLowerCase() === 'yes') ? 'true' : 'false';
                        }
                        
                        // แปลงค่าที่เป็น array หรือ object เป็นข้อความ
                        if (typeof fieldValue === 'object' && fieldValue !== null) {
                            fieldValue = JSON.stringify(fieldValue);
                        }
                        
                        // จัดการค่า null หรือ undefined
                        if (fieldValue === null || fieldValue === undefined) {
                            fieldValue = '';
                        }
                        
                        csvData.push([fieldId, field.label, fieldValue, field.type]);
                    });
                }
                
                // ส่วนที่ 3: Taxonomy data
                if (data.taxonomies) {
                    csvData.push([]);  // บรรทัดว่าง
                    csvData.push(['=== หมวดหมู่และคำสำคัญ ===']);
                    csvData.push(['Taxonomy ID', 'Taxonomy Label', 'Term Name', 'Term Slug', 'Term ID']);
                    
                    Object.keys(data.taxonomies).forEach(taxSlug => {
                        const taxonomy = data.taxonomies[taxSlug];
                        
                        if (taxonomy.terms && taxonomy.terms.length > 0) {
                            taxonomy.terms.forEach(term => {
                                csvData.push([
                                    taxSlug, 
                                    taxonomy.label, 
                                    term.name || '', 
                                    term.slug || '',
                                    term.term_id || ''
                                ]);
                            });
                        } else {
                            csvData.push([taxSlug, taxonomy.label, 'ไม่มีข้อมูล', '', '']);
                        }
                    });
                }
                
                // ส่วนที่ 4: Assets data
                if (data.assets && Array.isArray(data.assets)) {
                    csvData.push([]);  // บรรทัดว่าง
                    csvData.push(['=== ไฟล์ข้อมูลที่เกี่ยวข้อง ===']);
                    csvData.push(['ชื่อไฟล์', 'คำอธิบายไฟล์', 'ลิงค์']);
                    
                    if (data.assets.length > 0) {
                        data.assets.forEach(asset => {
                            csvData.push([
                                asset.name || '', 
                                asset.description || '', 
                                asset.link || ''
                            ]);
                        });
                    } else {
                        csvData.push(['ไม่มีข้อมูลไฟล์', '', '']);
                    }
                }
                
                // แปลงข้อมูลเป็น CSV string
                let csvContent = '';
                csvData.forEach(row => {
                    const processedRow = row.map(cell => {
                        // แปลงค่าเป็น string และ escape double quotes
                        const cellStr = String(cell || '').replace(/"/g, '""');
                        // ครอบด้วย quotes
                        return `"${cellStr}"`;
                    });
                    csvContent += processedRow.join(',') + '\n';
                });
                
                // เพิ่ม BOM ให้กับไฟล์ CSV เพื่อให้รองรับภาษาไทย
                const BOM = '\uFEFF';
                csvContent = BOM + csvContent;
                
                // สร้าง Blob สำหรับดาวน์โหลด
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                
                // สร้างชื่อไฟล์
                const filename = (data.post_title ? sanitizeFilename(data.post_title) : 'data') + '-ckan-metadata.csv';
                
                // สร้างและคลิกลิงก์ดาวน์โหลด
                if (navigator.msSaveBlob) { // สำหรับ IE
                    navigator.msSaveBlob(blob, filename);
                } else {
                    const link = document.createElement('a');
                    if (link.download !== undefined) {
                        // สำหรับเบราว์เซอร์ที่สนับสนุน HTML5 download attribute
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', filename);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    } else {
                        // สำหรับเบราว์เซอร์ที่ไม่สนับสนุน download attribute
                        const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
                        window.open(url);
                    }
                }
                
                // ลบ loading dialog
                loadingDialog.remove();
            })
            .catch(error => {
                // กรณีเกิดข้อผิดพลาด
                console.error('Error exporting CSV:', error);
                loadingDialog.remove();
                alert('เกิดข้อผิดพลาดในการสร้างไฟล์ CSV: ' + error.message);
            });
    } catch (error) {
        // กรณีเกิดข้อผิดพลาด
        console.error('Error exporting CSV:', error);
        loadingDialog.remove();
        alert('เกิดข้อผิดพลาดในการสร้างไฟล์ CSV: ' + error.message);
    }
}
    
    /**
     * ฟังก์ชันช่วยสำหรับทำความสะอาดชื่อไฟล์
     */
    function sanitizeFilename(filename) {
        return filename
            .toLowerCase()
            .replace(/\s+/g, '-')           // เปลี่ยนช่องว่างเป็น -
            .replace(/[^\w\-]/g, '')        // ลบอักขระที่ไม่ใช่ตัวอักษร ตัวเลข หรือ -
            .replace(/\-\-+/g, '-')         // เปลี่ยน -- เป็น -
            .replace(/^-+/, '')             // ตัด - ที่อยู่ต้นสตริง
            .replace(/-+$/, '');            // ตัด - ที่อยู่ท้ายสตริง
    }
    
    // ฟังก์ชันช่วย - escape HTML entities
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // เริ่มต้นการทำงาน
    initEditor();
});