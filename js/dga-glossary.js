/**
 * DGA Glossary JavaScript
 * File: /js/dga-glossary.js
 */

jQuery(document).ready(function($) {
    let currentPage = 1;
    let currentSearch = '';
    let currentLetter = '';
    let currentEditingCell = null;

    // Initialize
    loadGlossaryData();

    // Search functionality with debounce
    let searchTimeout;
    $('#dga-search-input').on('input', function() {
        const searchValue = $(this).val();
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            currentSearch = searchValue;
            currentPage = 1;
            loadGlossaryData();
        }, 500);
    });

    // Clear search
    $('#dga-clear-search').on('click', function() {
        // Reset all values
        $('#dga-search-input').val('');
        currentSearch = '';
        currentPage = 1;
        currentLetter = '';
        
        // Remove active state from all alphabet filters
        $('.alphabet-filter').removeClass('active');
        
        // Reset selected letter display
        updateSelectedLetterDisplay('');
        
        // Reload data to initial state
        loadGlossaryData();
    });

    // Alphabet filter
    $('.alphabet-filter').on('click', function() {
        $('.alphabet-filter').removeClass('active');
        $(this).addClass('active');
        currentLetter = $(this).data('char');
        currentPage = 1;
        
        // Update selected letter display
        updateSelectedLetterDisplay(currentLetter);
        
        loadGlossaryData();
    });

    // Load glossary data
    function loadGlossaryData() {
        showSkeletonLoader();
        
        $.ajax({
            url: dga_glossary_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_fetch_glossary',
                nonce: dga_glossary_ajax.nonce,
                post_types: dga_glossary_ajax.post_types,
                page: currentPage,
                search: currentSearch,
                letter: currentLetter
            },
            success: function(response) {
                if (response.success) {
                    renderTable(response.data);
                    renderPagination(response.pagination);
                } else {
                    showError('ไม่พบข้อมูล: ' + (response.message || ''));
                }
            },
            error: function(xhr, status, error) {
                showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error);
            }
        });
    }

    // Render table
    function renderTable(data) {
        const tbody = $('#dga-glossary-tbody');
        tbody.empty();

        if (data.length === 0) {
            tbody.html('<tr><td colspan="5" class="no-data">ไม่พบข้อมูล</td></tr>');
            return;
        }

        // Check if user is admin from data attribute
        const isAdmin = $('#dga-glossary-container').attr('data-is-admin') === 'true';

        data.forEach(function(item) {
            const row = $('<tr>');
            
            // Thai term with edit button
            let thaiHtml = '<div class="editable-cell">' +
                '<span class="cell-value">' + highlightSearchTerm(item.thai || '') + '</span>';
            
            if (isAdmin) {
                thaiHtml += '<button class="edit-btn" data-id="' + item.id + '" data-field="thai"><i class="edit-icon">✏️</i></button>';
            }
            thaiHtml += '</div>';
            
            const thaiCell = $('<td data-label="คำศัพท์ (ไทย):">').html(thaiHtml);
            
            // English term with edit button
            let englishHtml = '<div class="editable-cell">' +
                '<span class="cell-value">' + highlightSearchTerm(item.english || '') + '</span>';
            
            if (isAdmin) {
                englishHtml += '<button class="edit-btn" data-id="' + item.id + '" data-field="english"><i class="edit-icon">✏️</i></button>';
            }
            englishHtml += '</div>';
            
            const englishCell = $('<td data-label="คำศัพท์ (English):">').html(englishHtml);
            
            // Content
            const contentCell = $('<td data-label="คำอธิบาย:">').html(highlightSearchTerm(item.content || ''));
            
            // Source
            const sourceCell = $('<td data-label="ที่มา:">').text(item.source || '');
            
            // URL
            const urlCell = $('<td data-label="URL:">').html(
                '<a href="' + item.url + '" class="view-btn" target="_blank">ดูข้อมูล</a>'
            );
            
            row.append(thaiCell, englishCell, contentCell, sourceCell, urlCell);
            tbody.append(row);
        });

        // Attach edit functionality if admin
        if (isAdmin) {
            attachEditFunctionality();
        }
    }

    // Attach edit functionality
    function attachEditFunctionality() {
        $('.edit-btn').off('click').on('click', function() {
            const btn = $(this);
            const cell = btn.closest('.editable-cell');
            const currentValue = cell.find('.cell-value').text();
            const postId = btn.data('id');
            const field = btn.data('field');

            // If already editing another cell, cancel it
            if (currentEditingCell && currentEditingCell !== cell[0]) {
                cancelEdit($(currentEditingCell));
            }

            // Create edit input
            const input = $('<input type="text" class="edit-input">').val(currentValue);
            const saveBtn = $('<button class="save-btn">บันทึก</button>');
            const cancelBtn = $('<button class="cancel-btn">ยกเลิก</button>');
            const editContainer = $('<div class="edit-container">').append(input, saveBtn, cancelBtn);

            // Replace cell content
            cell.empty().append(editContainer);
            currentEditingCell = cell[0];
            input.focus();

            // Save functionality
            saveBtn.on('click', function() {
                const newValue = input.val();
                saveEdit(postId, field, newValue, cell, currentValue);
            });

            // Cancel functionality
            cancelBtn.on('click', function() {
                cancelEdit(cell, currentValue);
            });

            // Enter key to save
            input.on('keypress', function(e) {
                if (e.which === 13) {
                    saveBtn.click();
                }
            });
        });
    }

    // Save edit
    function saveEdit(postId, field, value, cell, originalValue) {
        $.ajax({
            url: dga_glossary_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_update_glossary_term',
                nonce: dga_glossary_ajax.nonce,
                post_id: postId,
                field: field,
                value: value
            },
            success: function(response) {
                if (response.success) {
                    // Update cell with new value
                    cell.html(
                        '<span class="cell-value">' + value + '</span>' +
                        '<button class="edit-btn" data-id="' + postId + '" data-field="' + field + '"><i class="edit-icon">✏️</i></button>'
                    );
                    currentEditingCell = null;
                    attachEditFunctionality();
                    showNotification('บันทึกข้อมูลสำเร็จ', 'success');
                } else {
                    showNotification(response.message || 'เกิดข้อผิดพลาด', 'error');
                    cancelEdit(cell, originalValue);
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                cancelEdit(cell, originalValue);
            }
        });
    }

    // Cancel edit
    function cancelEdit(cell, originalValue) {
        const postId = cell.find('.edit-btn').data('id') || cell.find('.edit-input').data('id');
        const field = cell.find('.edit-btn').data('field') || cell.find('.edit-input').data('field');
        
        cell.html(
            '<span class="cell-value">' + (originalValue || '') + '</span>' +
            '<button class="edit-btn" data-id="' + postId + '" data-field="' + field + '"><i class="edit-icon">✏️</i></button>'
        );
        currentEditingCell = null;
        attachEditFunctionality();
    }

    // Render pagination
    function renderPagination(pagination) {
        const container = $('#dga-glossary-pagination');
        container.empty();

        if (pagination.total_pages <= 1) {
            return;
        }

        // Previous button
        if (pagination.current_page > 1) {
            container.append(
                $('<button class="pagination-btn prev">ก่อนหน้า</button>').on('click', function() {
                    currentPage = pagination.current_page - 1;
                    loadGlossaryData();
                })
            );
        }

        // Page numbers
        const pageNumbers = $('<div class="page-numbers">');
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $('<button class="page-number">' + i + '</button>');
            
            if (i === pagination.current_page) {
                pageBtn.addClass('active');
            }
            
            pageBtn.on('click', function() {
                currentPage = i;
                loadGlossaryData();
            });
            
            pageNumbers.append(pageBtn);
        }
        
        container.append(pageNumbers);

        // Next button
        if (pagination.current_page < pagination.total_pages) {
            container.append(
                $('<button class="pagination-btn next">ถัดไป</button>').on('click', function() {
                    currentPage = pagination.current_page + 1;
                    loadGlossaryData();
                })
            );
        }

        // Page info
        container.append(
            $('<div class="page-info">').text(
                'หน้า ' + pagination.current_page + ' จาก ' + pagination.total_pages +
                ' (ทั้งหมด ' + pagination.total_posts + ' รายการ)'
            )
        );
    }

    // Highlight search term
    function highlightSearchTerm(text) {
        if (!currentSearch || !text) {
            return text;
        }

        const regex = new RegExp('(' + escapeRegExp(currentSearch) + ')', 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Show skeleton loader
    function showSkeletonLoader() {
        const tbody = $('#dga-glossary-tbody');
        let skeletonRows = '';
        
        // Generate 5 skeleton rows
        for (let i = 0; i < 5; i++) {
            skeletonRows += 
                '<tr class="skeleton-row">' +
                    '<td colspan="5">' +
                        '<div class="skeleton-wrapper">' +
                            '<div class="skeleton-item"></div>' +
                            '<div class="skeleton-item"></div>' +
                            '<div class="skeleton-item"></div>' +
                            '<div class="skeleton-item"></div>' +
                            '<div class="skeleton-item"></div>' +
                        '</div>' +
                    '</td>' +
                '</tr>';
        }
        
        tbody.html(skeletonRows);
    }

    // Show notification
    function showNotification(message, type) {
        const notification = $('<div class="dga-notification ' + type + '">' + message + '</div>');
        $('body').append(notification);
        
        setTimeout(function() {
            notification.addClass('show');
        }, 100);
        
        setTimeout(function() {
            notification.removeClass('show');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Show error
    function showError(message) {
        const tbody = $('#dga-glossary-tbody');
        tbody.html(
            '<tr><td colspan="5" class="error-message">' + message + '</td></tr>'
        );
    }

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Update selected letter display
    function updateSelectedLetterDisplay(letter) {
        const displayBox = $('.selected-letter-box');
        const displayText = $('#selected-letter-text');
        
        if (letter) {
            displayText.text(letter);
            displayBox.addClass('active');
        } else {
            displayText.text('-');
            displayBox.removeClass('active');
        }
    }
});