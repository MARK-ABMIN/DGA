/**
 * Data Post E JavaScript - TinyMCE 6 Full Support
 * Version: 1.2.0
 * Description: Frontend post editor with complete TinyMCE 6 support
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Global variables
    var editorInstances = {};
    var activeEditorId = '';
    
    /**
     * Initialize the post editor
     */
    function init() {
        bindEvents();
        console.log('Data Post E Editor initialized - Version 1.2.0');
    }
    
    /**
     * Bind all event handlers
     */
    function bindEvents() {
        // Open modal
        $(document).on('click', '.data-post-e-icon', handleEditClick);
        
        // Close modal
        $(document).on('click', '.data-post-e-close, .cancel-btn', closeModal);
        $(document).on('click', function(e) {
            if ($(e.target).hasClass('data-post-e-modal')) {
                closeModal();
            }
        });
        
        // Form submission
        $(document).on('submit', '.data-post-e-form', handleFormSubmit);
        
        // Delete post
        $(document).on('click', '.delete-post-btn', handleDeleteClick);
        $(document).on('click', '.confirm-delete-btn', handleDeleteConfirm);
        $(document).on('click', '.cancel-delete-btn', closeDeleteModal);
        
        // Notification modal
        $(document).on('click', '.notification-confirm-btn', closeNotificationModal);
        
        // Repeater fields
        $(document).on('click', '#add-row-btn', addRepeaterRow);
        $(document).on('click', '.remove-row-btn', removeRepeaterRow);
        $(document).on('click', '.upload-new-file-btn', handleFileUpload);
        $(document).on('click', '.link-file-btn', toggleUrlField);
        $(document).on('change', '.manual-url-input', updateFileLink);
    }
    
    /**
     * Handle edit icon click
     */
    function handleEditClick(e) {
        e.preventDefault();
        var postId = $(this).data('post-id');
        activeEditorId = 'at_content_' + postId;
        
        // Show modal
        $('#data-post-e-modal-' + postId).fadeIn(300);
        $('body').addClass('modal-open');
        
        // Initialize editor after modal is visible
        setTimeout(function() {
            initTinyMCE(activeEditorId);
        }, 100);
    }
    
    /**
     * Initialize TinyMCE 6
     */
    function initTinyMCE(editorId) {
        console.log('Initializing TinyMCE for:', editorId);
        
        // Check if element exists
        if (!$('#' + editorId).length) {
            console.error('Editor element not found:', editorId);
            return;
        }
        
        // Check if TinyMCE is loaded
        if (typeof tinymce === 'undefined') {
            console.error('TinyMCE is not loaded. Retrying in 1 second...');
            setTimeout(function() {
                initTinyMCE(editorId);
            }, 1000);
            return;
        }
        
        // Remove existing editor if present
        if (tinymce.get(editorId)) {
            console.log('Removing existing editor');
            tinymce.get(editorId).remove();
        }
        
        // TinyMCE 6 configuration with full toolbar
        tinymce.init({
            selector: '#' + editorId,
            language: 'th_TH',
            height: 500,
            menubar: true,
            statusbar: true,
            resize: true,
            branding: false,
            promotion: false,
            extended_valid_elements: 'img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name|loading=lazy]',
            images_upload_credentials: true,
            
            // Plugins
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autosave',
                'quickbars', 'emoticons', 'codesample', 'directionality', 'hr',
                'nonbreaking', 'pagebreak', 'visualchars', 'template', 'save'
            ],
            
            // Toolbar configuration
            toolbar1: 'save | undo redo | formatselect | fontselect fontsizeselect | forecolor backcolor | emoticons',
            toolbar2: 'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist',
            toolbar3: 'table | link image media | hr pagebreak | blockquote | removeformat | code fullscreen preview | help',
            
            // Quick selection toolbar
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
            quickbars_insert_toolbar: 'quickimage quicktable quicklink',
            
            // Context menu
            contextmenu: 'link image table',
            
            // Font options
            font_size_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 72pt',
            font_family_formats: 'Andale Mono=andale mono,monospace;' +
                'Arial=arial,helvetica,sans-serif;' +
                'Arial Black=arial black,sans-serif;' +
                'Book Antiqua=book antiqua,palatino,serif;' +
                'Comic Sans MS=comic sans ms,sans-serif;' +
                'Courier New=courier new,courier,monospace;' +
                'Georgia=georgia,palatino,serif;' +
                'Helvetica=helvetica,arial,sans-serif;' +
                'Impact=impact,sans-serif;' +
                'Tahoma=tahoma,arial,helvetica,sans-serif;' +
                'Times New Roman=times new roman,times,serif;' +
                'Trebuchet MS=trebuchet ms,geneva,sans-serif;' +
                'Verdana=verdana,geneva,sans-serif;' +
                'Sarabun=Sarabun,sans-serif;' +
                'Prompt=Prompt,sans-serif;' +
                'Kanit=Kanit,sans-serif;' +
                'Noto Sans Thai=Noto Sans Thai,sans-serif',
            
            // Format options
            block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre',
            
            // Image and media options
            image_advtab: true,
            image_caption: true,
            file_picker_types: 'image media',
            automatic_uploads: true,
            images_upload_handler: uploadHandler,
            images_reuse_filename: true,
            paste_data_images: true,
            
            // URL options
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            document_base_url: data_post_e_vars.home_url + '/',
            
            // Content styling
            content_style: `
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', sans-serif; 
                    font-size: 16px; 
                    line-height: 1.6; 
                    color: #333;
                    max-width: 100%;
                    padding: 10px;
                }
                img { max-width: 100%; height: auto; }
                table { border-collapse: collapse; width: 100%; }
                table td, table th { border: 1px solid #ddd; padding: 8px; }
                .mce-content-body { padding: 10px; }
                blockquote { 
                    border-left: 4px solid #ccc; 
                    margin: 1em 0; 
                    padding-left: 1em; 
                }
                pre { 
                    background: #f4f4f4; 
                    border: 1px solid #ddd; 
                    border-radius: 4px; 
                    padding: 10px; 
                    overflow-x: auto; 
                }
            `,
            
            // Paste options
            paste_data_images: true,
            paste_as_text: false,
            
            // Table options
            table_default_attributes: {
                border: '1'
            },
            table_default_styles: {
                borderCollapse: 'collapse',
                width: '100%'
            },
            
            // Template examples
            templates: [
                {
                    title: 'บทความมาตรฐาน',
                    description: 'โครงสร้างบทความพื้นฐาน',
                    content: '<h2>หัวข้อหลัก</h2><p>เนื้อหาบทความ...</p><h3>หัวข้อย่อย</h3><p>รายละเอียดเพิ่มเติม...</p>'
                },
                {
                    title: 'รายการสั่งซื้อ',
                    description: 'ตารางรายการสั่งซื้อ',
                    content: '<table><thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา</th></tr></thead><tbody><tr><td>สินค้า 1</td><td>1</td><td>100</td></tr></tbody></table>'
                }
            ],
            
            // File picker callback for WordPress Media
            file_picker_callback: function(callback, value, meta) {
                if (meta.filetype === 'image' || meta.filetype === 'media') {
                    // Use WordPress Media Library if available
                    if (typeof wp !== 'undefined' && wp.media) {
                        var mediaUploader = wp.media({
                            title: 'เลือกหรืออัพโหลดสื่อ',
                            multiple: false,
                            library: {
                                type: meta.filetype === 'image' ? 'image' : undefined
                            }
                        });
                        
                        mediaUploader.on('select', function() {
                            var attachment = mediaUploader.state().get('selection').first().toJSON();
                            var url = attachment.url;
                            var title = attachment.title || attachment.filename;
                            
                            // Use full size image URL if available
                            if (attachment.sizes && attachment.sizes.full) {
                                url = attachment.sizes.full.url;
                            }
                            
                            if (meta.filetype === 'image') {
                                callback(url, {
                                    alt: attachment.alt || title,
                                    title: title,
                                    width: attachment.width,
                                    height: attachment.height
                                });
                            } else {
                                callback(url, {
                                    text: title,
                                    title: title
                                });
                            }
                        });
                        
                        mediaUploader.open();
                    } else {
                        // Fallback to browser file picker
                        var input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', meta.filetype === 'image' ? 'image/*' : '*/*');
                        
                        input.onchange = function() {
                            var file = this.files[0];
                            var reader = new FileReader();
                            reader.onload = function () {
                                var id = 'blobid' + (new Date()).getTime();
                                var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                                var base64 = reader.result.split(',')[1];
                                var blobInfo = blobCache.create(id, file, base64);
                                blobCache.add(blobInfo);
                                
                                // Call the callback and populate the Title field
                                callback(blobInfo.blobUri(), { title: file.name });
                            };
                            reader.readAsDataURL(file);
                        };
                        
                        input.click();
                    }
                }
            },
            
            // Setup callback
            setup: function(editor) {
                console.log('TinyMCE setup:', editor.id);
                
                // Store editor instance
                editorInstances[editorId] = editor;
                
                // On init
                editor.on('init', function() {
                    console.log('TinyMCE initialized:', editor.id);
                    
                    // Set initial content
                    var originalContent = $('#' + editorId).val();
                    if (originalContent) {
                        editor.setContent(originalContent);
                    }
                    
                    // Focus editor
                    editor.focus();
                });
                
                // Auto save on change
                editor.on('change keyup', function() {
                    editor.save();
                });
                
                // Custom save button action
                editor.ui.registry.addButton('save', {
                    text: 'Save',
                    icon: 'save',
                    tooltip: 'บันทึก',
                    onAction: function() {
                        $('#' + editorId).closest('form').submit();
                    }
                });
                
                // Custom media button
                editor.ui.registry.addButton('wp_media', {
                    text: 'WordPress Media',
                    icon: 'gallery',
                    tooltip: 'เปิด WordPress Media Library',
                    onAction: function() {
                        openWordPressMedia(editor);
                    }
                });
            }
        });
    }
    
    /**
     * Upload handler for images
     */
    function uploadHandler(blobInfo, success, failure, progress) {
        console.log('Starting upload for:', blobInfo.filename());
        
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        
        xhr.withCredentials = false;
        xhr.open('POST', data_post_e_vars.ajax_url);
        
        // Progress handler
        if (progress && xhr.upload) {
            xhr.upload.onprogress = function(e) {
                progress(e.loaded / e.total * 100);
            };
        }
        
        xhr.onload = function() {
            console.log('Upload response:', xhr.responseText);
            
            if (xhr.status < 200 || xhr.status >= 300) {
                failure('HTTP Error: ' + xhr.status);
                return;
            }
            
            var json;
            try {
                json = JSON.parse(xhr.responseText);
            } catch (e) {
                failure('Invalid JSON: ' + xhr.responseText);
                return;
            }
            
            if (!json || !json.success) {
                failure('Upload failed: ' + (json && json.data && json.data.message ? json.data.message : 'Unknown error'));
                return;
            }
            
            if (!json.data || !json.data.url) {
                failure('Invalid response structure');
                return;
            }
            
            console.log('Upload successful:', json.data.url);
            success(json.data.url);
        };
        
        xhr.onerror = function() {
            failure('XMLHttpRequest error');
        };
        
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        formData.append('action', 'data_post_e_upload_image');
        formData.append('nonce', data_post_e_vars.nonce);
        
        xhr.send(formData);
    }
    
    /**
     * Open WordPress Media Library
     */
    function openWordPressMedia(editor) {
        if (typeof wp !== 'undefined' && wp.media) {
            var mediaUploader = wp.media({
                title: 'เลือกหรืออัพโหลดสื่อ',
                multiple: true
            });
            
            mediaUploader.on('select', function() {
                var attachments = mediaUploader.state().get('selection').toJSON();
                attachments.forEach(function(attachment) {
                    var html = '';
                    if (attachment.type === 'image') {
                        html = '<img src="' + attachment.url + '" alt="' + (attachment.alt || attachment.title || '') + '" />';
                    } else {
                        html = '<a href="' + attachment.url + '">' + attachment.title + '</a>';
                    }
                    editor.insertContent(html);
                });
            });
            
            mediaUploader.open();
        }
    }
    
    /**
     * Remove editor
     */
    function removeEditor() {
        if (activeEditorId && tinymce.get(activeEditorId)) {
            tinymce.get(activeEditorId).save();
            tinymce.get(activeEditorId).remove();
            delete editorInstances[activeEditorId];
        }
    }
    
    /**
     * Close modal
     */
    function closeModal() {
        removeEditor();
        $('.data-post-e-modal').fadeOut(300);
        $('body').removeClass('modal-open');
    }
    
    /**
     * Close notification modal
     */
    function closeNotificationModal() {
        $('.notification-modal').fadeOut(300);
        location.reload();
    }
    
    /**
     * Close delete confirmation modal
     */
    function closeDeleteModal() {
        $('.delete-confirm-modal').fadeOut(300);
    }
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $submitBtn = $form.find('.save-post-btn');
        var postId = $form.find('input[name="post_id"]').val();
        
        // Save editor content
        if (activeEditorId && tinymce.get(activeEditorId)) {
            tinymce.get(activeEditorId).save();
        }
        
        // Show saving status
        $submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        // Prepare form data
        var formData = $form.serializeArray();
        formData.push({name: 'action', value: 'data_post_e_save'});
        formData.push({name: 'nonce', value: data_post_e_vars.nonce});
        
        // Send AJAX request
        $.ajax({
            type: 'POST',
            url: data_post_e_vars.ajax_url,
            data: formData,
            success: function(response) {
                if (response.success) {
                    closeModal();
                    $('#notification-modal-' + postId).fadeIn(300);
                } else {
                    showNotification(response.data.message || 'เกิดข้อผิดพลาด', 'error');
                    $submitBtn.prop('disabled', false).text('บันทึกข้อมูล');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                $submitBtn.prop('disabled', false).text('บันทึกข้อมูล');
            }
        });
    }
    
    /**
     * Handle delete button click
     */
    function handleDeleteClick() {
        var postId = $(this).closest('form').find('input[name="post_id"]').val();
        $('#delete-confirm-modal-' + postId).fadeIn(300);
    }
    
    /**
     * Handle delete confirmation
     */
    function handleDeleteConfirm() {
        var $btn = $(this);
        var postId = $(this).closest('.delete-confirm-modal').attr('id').replace('delete-confirm-modal-', '');
        
        $btn.text('กำลังลบ...').prop('disabled', true);
        
        $.ajax({
            type: 'POST',
            url: data_post_e_vars.ajax_url,
            data: {
                action: 'data_post_e_delete',
                post_id: postId,
                nonce: data_post_e_vars.nonce
            },
            success: function(response) {
                if (response.success) {
                    showNotification('ลบโพสเรียบร้อยแล้ว', 'success');
                    setTimeout(function() {
                        window.location.href = response.data.redirect;
                    }, 2000);
                } else {
                    closeDeleteModal();
                    showNotification(response.data.message || 'เกิดข้อผิดพลาด', 'error');
                }
            },
            error: function() {
                closeDeleteModal();
                showNotification('เกิดข้อผิดพลาดในการลบโพส', 'error');
            }
        });
    }
    
    /**
     * Add repeater row
     */
    function addRepeaterRow() {
        var $repeater = $('#at_file_standard_repeater');
        var index = $repeater.children('.repeater-row').length;
        var currentDate = getCurrentDate();
        
        var newRow = `
            <div class="repeater-row">
                <div class="repeater-field">
                    <label>ชื่อไฟล์:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_name]" value="">
                </div>
                <div class="repeater-field">
                    <label>วันที่นำเข้า:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_create]" value="${currentDate}">
                </div>
                <div class="repeater-field file-actions">
                    <input type="hidden" name="at_file_standard[${index}][at_rp_file_link]" class="file-link-input" value="">
                    <a href="#" class="download-file-btn" target="_blank" style="display:none;">ดาวน์โหลดไฟล์</a>
                    <button type="button" class="upload-new-file-btn">อัพโหลดไฟล์ใหม่</button>
                    <button type="button" class="link-file-btn">ลิงค์</button>
                    <button type="button" class="remove-row-btn">ลบ</button>
                </div>
                <div class="repeater-field url-field" style="display:none;">
                    <label>URL:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_url]" class="manual-url-input" value="">
                </div>
            </div>
        `;
        
        $repeater.append(newRow);
        reindexRepeaterFields();
    }
    
    /**
     * Remove repeater row
     */
    function removeRepeaterRow() {
        var $repeater = $('#at_file_standard_repeater');
        var $rows = $repeater.children('.repeater-row');
        
        if ($rows.length === 1) {
            // Clear values if only one row
            $(this).closest('.repeater-row').find('input[type="text"]').val('');
            $(this).closest('.repeater-row').find('.file-link-input').val('');
            $(this).closest('.repeater-row').find('.download-file-btn').attr('href', '#').hide();
            $(this).closest('.repeater-row').find('.url-field').hide();
        } else {
            $(this).closest('.repeater-row').remove();
            reindexRepeaterFields();
        }
    }
    
    /**
     * Handle file upload
     */
    function handleFileUpload() {
        var $button = $(this);
        var $row = $button.closest('.repeater-row');
        var $fileInput = $row.find('.file-link-input');
        var $downloadBtn = $row.find('.download-file-btn');
        var $fileNameInput = $row.find('input[name*="[at_rp_file_name]"]');
        var $manualUrlInput = $row.find('.manual-url-input');
        
        // Check if Media Library is available
        if (!window.wp || !window.wp.media) {
            showNotification('Media Library ไม่พร้อมใช้งาน', 'error');
            return;
        }
        
        // Open WordPress Media Library
        var mediaUploader = wp.media({
            title: 'เลือกหรืออัพโหลดไฟล์',
            button: {
                text: 'เลือกไฟล์นี้'
            },
            multiple: false
        });
        
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            
            // Update file URL
            $fileInput.val(attachment.url);
            $downloadBtn.attr('href', attachment.url).show();
            $manualUrlInput.val(attachment.url);
            
            // Update filename if empty
            if ($fileNameInput.val() === '') {
                $fileNameInput.val(attachment.title || attachment.filename);
            }
        });
        
        mediaUploader.open();
    }
    
    /**
     * Toggle URL field
     */
    function toggleUrlField() {
        var $row = $(this).closest('.repeater-row');
        var $urlField = $row.find('.url-field');
        
        if ($urlField.is(':visible')) {
            $urlField.slideUp(200);
        } else {
            $urlField.slideDown(200);
        }
    }
    
    /**
     * Update file link
     */
    function updateFileLink() {
        var $row = $(this).closest('.repeater-row');
        var $fileLink = $row.find('.file-link-input');
        var $downloadBtn = $row.find('.download-file-btn');
        var url = $(this).val();
        
        $fileLink.val(url);
        if (url) {
            $downloadBtn.attr('href', url).show();
        } else {
            $downloadBtn.attr('href', '#').hide();
        }
    }
    
    /**
     * Reindex repeater fields
     */
    function reindexRepeaterFields() {
        $('#at_file_standard_repeater .repeater-row').each(function(index) {
            $(this).find('input, select').each(function() {
                var name = $(this).attr('name');
                if (name) {
                    var newName = name.replace(/\[\d+\]/, '[' + index + ']');
                    $(this).attr('name', newName);
                }
            });
        });
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type) {
        var $notification = $('<div class="data-post-e-notification ' + type + '">' + message + '</div>');
        $('body').append($notification);
        
        $notification.fadeIn(300);
        
        setTimeout(function() {
            $notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    /**
     * Get current date in Thai format
     */
    function getCurrentDate() {
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        
        return day + '/' + month + '/' + year;
    }
    
    /**
     * Check TinyMCE availability
     */
    function checkTinyMCE() {
        if (typeof tinymce === 'undefined') {
            console.error('TinyMCE is not loaded');
            setTimeout(checkTinyMCE, 1000);
        } else {
            console.log('TinyMCE is available:', tinymce.majorVersion + '.' + tinymce.minorVersion);
        }
    }
    
    // Initialize
    init();
    
    // Check TinyMCE after page load
    $(window).on('load', function() {
        checkTinyMCE();
    });
});