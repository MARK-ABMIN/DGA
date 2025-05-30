(function($) {
    'use strict';
    
    $(document).ready(function() {
        // เริ่มต้นโหลดโพสต์สำหรับทุก container
        $('.dynamic-post-cards-container').each(function() {
            const container = $(this);
            initPostCards(container);
        });
        
        // ฟังก์ชันเริ่มต้นสำหรับแต่ละ container
        function initPostCards(container) {
            const contentContainer = container.find('.dynamic-post-cards-content');
            const loadingContainer = container.find('.dynamic-post-cards-loading');
            const loadMoreBtn = container.find('.load-more-btn');
            const noResultsMessage = container.find('.no-results-message');
            
            // ตัวแปรสำหรับเก็บข้อมูลสถานะ
            const state = {
                postType: container.data('post-type'),
                postsPerPage: container.data('posts-per-page'),
                category: container.data('category'),
                orderby: 'date',
                order: 'DESC',
                paged: 1,
                maxPages: 1,
                view: container.data('view'),
                isLoading: false,
                search: '',
                year: '',
                searchTimer: null
            };
            
            // เพิ่มปุ่มเฟืองสำหรับมือถือ
            setupMobileFilterToggle();
            
            // โหลดโพสต์ครั้งแรก
            loadPosts();
            
            // ตั้งค่า event listeners
            setupEventListeners();
            
            // ฟังก์ชันตัดข้อความให้ไม่เกิน 95 ตัวอักษร
            function truncateText(text, maxLength = 95) {
                if (text.length <= maxLength) return text;
                
                // ตัดข้อความที่ตำแหน่ง maxLength
                let truncated = text.substr(0, maxLength);
                
                // หาตำแหน่งช่องว่างสุดท้ายเพื่อไม่ให้ตัดกลางคำ
                const lastSpaceIndex = truncated.lastIndexOf(' ');
                if (lastSpaceIndex > 0) {
                    truncated = truncated.substr(0, lastSpaceIndex);
                }
                
                return truncated + '...';
            }
            
            // ฟังก์ชันตั้งค่า Mobile Filter Toggle
            function setupMobileFilterToggle() {
                // เพิ่มปุ่มเฟืองสำหรับมือถือ
                const toggleButtonId = container.attr('id') + '-mobile-toggle';
                const toggleButton = $('<button id="' + toggleButtonId + '" class="mobile-filter-toggle"><span class="dashicons dashicons-admin-generic"></span></button>');
                
                // เพิ่มปุ่มเข้าไปด้านบนของ controls
                container.find('.dynamic-post-cards-controls').prepend(toggleButton);
                
                // จัดการการคลิกปุ่ม
                toggleButton.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    container.find('.filter-controls').toggleClass('active');
                });
                
                // ปิดเมนูเมื่อคลิกที่อื่น
                $(document).on('click', function(event) {
                    if (!$(event.target).closest('.filter-controls', container).length && 
                        !$(event.target).closest('.mobile-filter-toggle', container).length) {
                        container.find('.filter-controls').removeClass('active');
                    }
                });
            }
            
            function setupEventListeners() {
                // สลับมุมมองระหว่าง Card View และ List View
                container.find('.view-mode-btn').on('click', function() {
                    const viewMode = $(this).hasClass('card-view-btn') ? 'card' : 'list';
                    
                    // เปลี่ยนปุ่มที่ active
                    container.find('.view-mode-btn').removeClass('active');
                    $(this).addClass('active');
                    
                    // เปลี่ยน class ของ content container
                    contentContainer.removeClass('card-view list-view').addClass(viewMode + '-view');
                    
                    // อัปเดตสถานะ
                    state.view = viewMode;
                    
                    // อัปเดต layout
                    renderPosts(state.currentPosts || []);
                });
                
                // การเรียงลำดับ
                container.find('.sorting-select').on('change', function() {
                    const sortValue = $(this).val();
                    const [sortBy, sortOrder] = sortValue.split('-');
                    
                    // อัปเดตสถานะ
                    state.orderby = sortBy;
                    state.order = sortOrder.toUpperCase();
                    state.paged = 1;
                    
                    // โหลดโพสต์ใหม่
                    loadPosts();
                });
                
                // การค้นหา (กำหนด debounce เพื่อไม่ให้ส่ง request มากเกินไป)
                container.find('.search-input').on('input', function() {
                    const searchTerm = $(this).val().trim();
                    
                    // ยกเลิก timer เดิม
                    if (state.searchTimer) {
                        clearTimeout(state.searchTimer);
                    }
                    
                    // สร้าง timer ใหม่สำหรับ debounce (รอ 500ms)
                    state.searchTimer = setTimeout(function() {
                        if (state.search !== searchTerm) {
                            state.search = searchTerm;
                            state.paged = 1;
                            loadPosts();
                        }
                    }, 500);
                });
                
                // กรองตามปี
                container.find('.year-filter-select').on('change', function() {
                    const yearValue = $(this).val();
                    
                    // อัปเดตสถานะ
                    state.year = yearValue;
                    state.paged = 1;
                    
                    // โหลดโพสต์ใหม่
                    loadPosts();
                });
                
                // โหลดเพิ่มเติม
                loadMoreBtn.on('click', function() {
                    if (state.paged < state.maxPages && !state.isLoading) {
                        state.paged++;
                        loadPosts(true); // true = append mode
                    }
                });
            }
            
            // ฟังก์ชันโหลดโพสต์
            function loadPosts(append = false) {
                if (state.isLoading) return;
                
                state.isLoading = true;
                
                // ซ่อนข้อความไม่พบผลลัพธ์
                noResultsMessage.hide();
                
                // แสดง loading skeleton ถ้าไม่ใช่โหมด append
                if (!append) {
                    contentContainer.empty();
                    loadingContainer.show();
                } else {
                    loadMoreBtn.text('กำลังโหลด...').prop('disabled', true);
                }
                
                // ส่ง AJAX request
                $.ajax({
                    url: dynamic_post_cards_params.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'dynamic_post_cards_load_posts',
                        nonce: dynamic_post_cards_params.nonce,
                        post_type: state.postType,
                        posts_per_page: state.postsPerPage,
                        paged: state.paged,
                        category: state.category,
                        orderby: state.orderby,
                        order: state.order,
                        search: state.search,
                        year: state.year
                    },
                    success: function(response) {
                        if (response.success) {
                            // ตรวจสอบให้แน่ใจว่ามีโพสต์กลับมา
                            if (response.posts && Array.isArray(response.posts)) {
                                // เก็บข้อมูลสำหรับการใช้งานต่อไป
                                state.currentPosts = append 
                                    ? (state.currentPosts || []).concat(response.posts) 
                                    : response.posts;
                                state.maxPages = response.max_pages;
                                
                                // แสดงโพสต์
                                renderPosts(response.posts, append);
                                
                                // จัดการแสดงข้อความไม่พบผลลัพธ์
                                if (response.posts.length === 0 && !append) {
                                    noResultsMessage.show();
                                } else {
                                    noResultsMessage.hide();
                                }
                                
                                // จัดการปุ่มโหลดเพิ่มเติม
                                if (state.paged < state.maxPages) {
                                    loadMoreBtn.text('โหลดเพิ่มเติม').show().prop('disabled', false);
                                } else {
                                    loadMoreBtn.hide();
                                }
                            } else {
                                console.error('Invalid posts data in response', response);
                                if (!append) {
                                    contentContainer.empty();
                                    noResultsMessage.show();
                                }
                            }
                        } else {
                            console.error('Error loading posts', response);
                            if (!append) {
                                contentContainer.empty();
                                noResultsMessage.show();
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('AJAX error:', error);
                        if (!append) {
                            contentContainer.empty();
                            noResultsMessage.show();
                        }
                    },
                    complete: function() {
                        state.isLoading = false;
                        loadingContainer.hide();
                    }
                });
            }
            
            // ฟังก์ชันแสดงโพสต์
            function renderPosts(posts, append = false) {
                if (!append) {
                    contentContainer.empty();
                }
                
                // ตรวจสอบว่า posts เป็น array และมีข้อมูล
                if (!Array.isArray(posts) || posts.length === 0) {
                    if (!append) {
                        noResultsMessage.show();
                    }
                    return;
                }
                
                // ซ่อนข้อความไม่พบผลลัพธ์ เพราะมีโพสต์แล้ว
                noResultsMessage.hide();
                
                // สร้าง HTML สำหรับแต่ละโพสต์
                posts.forEach(function(post) {
                    let postHtml = '';
                    let imgAttributes = `src="${post.featured_image}" alt="${post.title}" loading="lazy" decoding="async"`;
                    
                    // สร้าง HTML สำหรับ badge ตามเงื่อนไข
                    let badgeHtml = '';
                    if (post.at_docnum_2) {
                        badgeHtml = `<div class="doc-badge gold-badge">เลขที่ มรด. ${post.at_docnum_2}</div>`;
                    } else if (post.at_docnum_1) {
                        badgeHtml = `<div class="doc-badge orange-badge">เลขที่ มสพร. ${post.at_docnum_1}</div>`;
                    }
                    
                    // ตัดข้อความ title ให้ไม่เกิน 95 ตัวอักษร
                    const truncatedTitle = truncateText(post.title, 95);
                    
                    if (state.view === 'card') {
                        postHtml = `
                            <div class="card-item">
                                <a href="${post.permalink}" class="card-image-link">
                                    <img ${imgAttributes} class="card-image">
                                    ${badgeHtml}
                                </a>
                                <div class="card-meta">
                                    <span class="post-date">${post.date}</span>
                                    <span class="visitor-count">${post.visitor_count}</span>
                                </div>
                                <h3 class="card-title" title="${post.title}">
                                    <a href="${post.permalink}">${truncatedTitle}</a>
                                </h3>
                                <div class="card-excerpt">${post.excerpt}</div>
                                <div class="card-footer">
                                    <a href="${post.permalink}" class="read-more-btn">อ่านต่อ</a>
                                </div>
                            </div>
                        `;
                    } else {
                        postHtml = `
                            <div class="list-item">
                                <a href="${post.permalink}" class="list-image-link">
                                    <img ${imgAttributes} class="list-image">
                                    ${badgeHtml}
                                </a>
                                <div class="list-content">
                                    <h3 class="list-title" title="${post.title}">
                                        <a href="${post.permalink}">${truncatedTitle}</a>
                                    </h3>
                                    <div class="list-meta">
                                        <span class="post-date">${post.date}</span>
                                        <span class="visitor-count">${post.visitor_count}</span>
                                    </div>
                                    <div class="list-excerpt">${post.excerpt}</div>
                                    <div class="list-footer">
                                        <a href="${post.permalink}" class="read-more-btn">อ่านต่อ</a>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                    contentContainer.append(postHtml);
                });
                
                // เลื่อนไปที่โพสต์ใหม่ที่โหลดมาถ้าเป็นโหมด append
                if (append && posts.length > 0) {
                    const firstNewPost = contentContainer.children().eq(contentContainer.children().length - posts.length);
                    $('html, body').animate({
                        scrollTop: firstNewPost.offset().top - 30
                    }, 500);
                }
            }
        }
    });
    
})(jQuery);