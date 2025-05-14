/**
 * WCAG Checker JavaScript
 * Handles AJAX requests and UI interactions
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Cache DOM elements
    const $container = $('.wcag-checker-container');
    const $loading = $container.find('.wcag-loading');
    const $results = $container.find('.wcag-results');
    const $grade = $container.find('.wcag-grade');
    const $checkButton = $container.find('.wcag-check-now');
    const $detailsToggle = $container.find('.wcag-details-toggle');
    const $details = $container.find('.wcag-details');
    const $modal = $('#wcag-modal');
    const $modalContent = $('#wcag-modal-body');
    const $loadingText = $container.find('.wcag-loading-text');
    const $loadingDetails = $container.find('.wcag-loading-details');
    const $debug = $container.find('.wcag-debug');
    
    // Debug logging
    function debugLog(message, data) {
        if (wcagAjax.debug && $debug.length) {
            const timestamp = new Date().toLocaleTimeString();
            let logEntry = `[${timestamp}] ${message}`;
            if (data) {
                logEntry += '\n' + JSON.stringify(data, null, 2);
            }
            $debug.append(logEntry + '\n\n');
            $debug.scrollTop($debug[0].scrollHeight);
        }
    }
    
    // Handle check button click
    $checkButton.on('click', function() {
        debugLog('Starting WCAG check');
        runWCAGCheck();
    });
    
    // Handle details toggle
    $detailsToggle.on('click', function() {
        $details.slideToggle();
        $(this).text($(this).text() === 'แสดงรายละเอียด' ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด');
    });
    
    // Modal close
    $('.wcag-modal-close, .wcag-modal').on('click', function(e) {
        if (e.target === this) {
            $modal.fadeOut();
        }
    });
    
    // Run WCAG check
    function runWCAGCheck() {
        $loading.show();
        $results.addClass('loading');
        $checkButton.prop('disabled', true);
        $loadingText.text('กำลังตรวจสอบ...');
        $loadingDetails.text('กำลังเชื่อมต่อกับเซิร์ฟเวอร์...');
        
        const data = {
            action: 'wcag_check',
            url: wcagAjax.currentUrl,
            severity: wcagAjax.severity || 'medium',
            nonce: wcagAjax.nonce
        };
        
        debugLog('Sending AJAX request', data);
        debugLog('AJAX URL', wcagAjax.ajaxurl);
        
        // Set longer timeout for the request
        $.ajax({
            url: wcagAjax.ajaxurl,
            type: 'POST',
            data: data,
            dataType: 'json',
            timeout: 120000, // 2 minutes timeout
            beforeSend: function(xhr) {
                debugLog('Request headers', xhr.getAllResponseHeaders());
            },
            success: function(response) {
                debugLog('Raw response', response);
                
                if (response) {
                    if (response.success) {
                        debugLog('Success response data', response.data);
                        displayResults(response.data);
                    } else {
                        const errorMsg = response.data ? (response.data.message || 'Unknown error') : 'No error message';
                        debugLog('Error response', response.data);
                        showError(errorMsg);
                        
                        // Show debug info if available
                        if (response.data && response.data.debug && wcagAjax.debug) {
                            console.error('Debug info:', response.data.debug);
                        }
                    }
                } else {
                    debugLog('Empty response');
                    showError('ได้รับ response ว่างเปล่าจากเซิร์ฟเวอร์');
                }
            },
            error: function(xhr, status, error) {
                debugLog('AJAX error', { 
                    status: status, 
                    error: error, 
                    responseText: xhr.responseText,
                    responseStatus: xhr.status,
                    responseHeaders: xhr.getAllResponseHeaders()
                });
                
                let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
                
                if (status === 'timeout') {
                    errorMessage = 'หมดเวลาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
                } else if (status === 'parsererror') {
                    errorMessage = 'ข้อมูลที่ได้รับจากเซิร์ฟเวอร์ไม่ถูกต้อง';
                    
                    // Try to parse PHP errors
                    if (xhr.responseText) {
                        const phpError = xhr.responseText.match(/<b>(Fatal error|Warning|Notice)<\/b>:(.+?)in/);
                        if (phpError) {
                            errorMessage += '\nPHP Error: ' + phpError[1] + ':' + phpError[2];
                        }
                    }
                } else if (xhr.status === 404) {
                    errorMessage = 'ไม่พบ AJAX endpoint (404)';
                } else if (xhr.status === 500) {
                    errorMessage = 'เซิร์ฟเวอร์เกิดข้อผิดพลาด (500)';
                } else if (xhr.status === 0) {
                    errorMessage = 'ไม่สามารถเชื่อมต่อได้ - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
                }
                
                showError(errorMessage);
                
                // If in debug mode, show more details
                if (wcagAjax.debug && xhr.responseText) {
                    console.error('Full response:', xhr.responseText);
                    $debug.append('\n\nFull Response:\n' + xhr.responseText);
                }
            },
            complete: function() {
                $loading.hide();
                $results.removeClass('loading');
                $checkButton.prop('disabled', false);
            }
        });
    }
    
    // Display results
    function displayResults(data) {
        debugLog('Displaying results', data);
        
        // Show grade
        if (data.grade) {
            $grade.html(`
                <div class="grade-circle grade-${data.grade}">
                    <span class="grade-letter">${data.grade}</span>
                    <span class="grade-score">${data.score.toFixed(1)}%</span>
                </div>
            `);
        } else {
            $grade.html(`
                <div class="grade-circle grade-fail">
                    <span class="grade-letter">F</span>
                    <span class="grade-score">${data.score.toFixed(1)}%</span>
                </div>
            `);
        }
        
        // Build details HTML
        let detailsHtml = '<div class="wcag-checks">';
        
        // Categories mapping
        const categoryNames = {
            'contrast': 'ความคมชัดของสี',
            'alt_text': 'ข้อความทางเลือกสำหรับรูปภาพ',
            'headers': 'โครงสร้างหัวข้อ',
            'aria': 'ARIA Labels',
            'keyboard': 'การใช้งานด้วยคีย์บอร์ด',
            'forms': 'ฟอร์มและป้ายกำกับ',
            'links': 'ลิงก์และการนำทาง'
        };
        
        // Display each category
        Object.keys(data.checks).forEach(function(category) {
            const check = data.checks[category];
            const passed = check.passed;
            const violations = check.violations || [];
            
            detailsHtml += `
                <div class="wcag-check-item ${passed ? 'passed' : 'failed'}">
                    <div class="check-header">
                        <span class="check-icon">${passed ? '✓' : '✗'}</span>
                        <span class="check-name">${categoryNames[category] || category}</span>
                        <span class="check-stats">
                            ${check.checked}/${check.total} ตรวจสอบแล้ว
                            ${violations.length > 0 ? ` - ${violations.length} ข้อผิดพลาด` : ''}
                        </span>
                    </div>
                    ${!passed ? buildViolationsList(violations) : ''}
                </div>
            `;
        });
        
        detailsHtml += '</div>';
        
        // Add processing info if available
        if (data.processing_info) {
            detailsHtml += `
                <div class="wcag-processing-info">
                    <p>ใช้มาตรฐาน: ${data.processing_info.guideline_used}</p>
                    <p>พบข้อผิดพลาดทั้งหมด: ${data.processing_info.violations_count} รายการ</p>
                </div>
            `;
        }
        
        $details.html(detailsHtml);
        $detailsToggle.show();
        
        // Bind click events for violations
        $('.violation-item').on('click', function() {
            const $this = $(this);
            const elementHtml = $this.data('element');
            const message = $this.find('.violation-message').text();
            
            showElementDetails(message, elementHtml);
        });
    }
    
    // Build violations list
    function buildViolationsList(violations) {
        if (violations.length === 0) return '';
        
        let html = '<div class="violations-list">';
        
        violations.forEach(function(violation, index) {
            const impactClass = getImpactClass(violation.impact);
            html += `
                <div class="violation-item" data-element="${escapeHtml(violation.element)}">
                    <span class="violation-impact ${impactClass}">${violation.impact || 'moderate'}</span>
                    <span class="violation-message">${escapeHtml(violation.message)}</span>
                    ${violation.line ? `<span class="violation-line">บรรทัด: ${violation.line}</span>` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Show element details in modal
    function showElementDetails(message, elementHtml) {
        let content = `
            <h3>รายละเอียดข้อผิดพลาด</h3>
            <div class="modal-section">
                <h4>ข้อความ:</h4>
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="modal-section">
                <h4>Element HTML:</h4>
                <pre class="element-code">${escapeHtml(elementHtml)}</pre>
            </div>
        `;
        
        $modalContent.html(content);
        $modal.fadeIn();
    }
    
    // Show error message
    function showError(message) {
        $grade.html(`
            <div class="wcag-error">
                <p>${escapeHtml(message)}</p>
            </div>
        `);
        $detailsToggle.hide();
    }
    
    // Get impact class
    function getImpactClass(impact) {
        switch (impact) {
            case 'critical': return 'impact-critical';
            case 'serious': return 'impact-serious';
            case 'moderate': return 'impact-moderate';
            case 'minor': return 'impact-minor';
            default: return 'impact-moderate';
        }
    }
    
    // Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Auto-check on page load if configured
    if (wcagAjax.autoCheck === 'true') {
        setTimeout(function() {
            runWCAGCheck();
        }, 1000);
    }
});