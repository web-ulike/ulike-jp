// 主模块 IIFE 包装，避免全局变量污染
(function () {
    // 页面加载完成后初始化逻辑
    document.addEventListener('DOMContentLoaded', () => {
        // 复制成功提示的隐藏定时器
        let hideTimer = null;
        // let getLoginStatus = false//登录状态
        let _href = window.location.href;
        let _base = 'https://account.ulike.com'
        let locationUrl = `${_base}/login?returnUrl=${_href}`; //登录路由


        //判断是否登录方法 未登录记录埋点  跳转至登录页
        function jumpLoginPage() {
            console.log('getLoginStatus',getLoginStatus)
            window.UlikeCommon.commonGtmEvent('老带新，浏览页面，未登录点击', 'more-btn', 'no-login');
            $('.login-modal').fadeIn(200);
            $('body').addClass('no-scroll');
        
        }
        // 已登录埋点公共调用方法
        function isLoginPriont(name, type, val) {
            if (getLoginStatus) {
                window.UlikeCommon.commonGtmEvent(name, type, val);
            }

        }
        //曝光埋点  公共过滤方法
        const onGtmEventList = []//埋点数据集合
        function pblicStaFliter(name, type, val) {
            let sendData = {
                name: name,
                type: type,
                value: val
            }
            if (onGtmEventList.length == 0) {
                onGtmEventList.push(sendData)
                window.UlikeCommon.commonGtmEvent(name, type, val);
            } else {
                // 判断是否已有相同 name 的埋点
                const isExist = onGtmEventList.some(item => item.name === name);
                if (!isExist) {
                    onGtmEventList.push(sendData);
                    window.UlikeCommon.commonGtmEvent(name, type, val);
                }
            }
        }

        // 将指定选择器的文本复制到剪贴板
        function copyTextToClipboard(copyText) {
            if (!getLoginStatus) {
                jumpLoginPage()
                return
            }
            const textToCopy = copyText;
            if (!textToCopy) {
                return
            }
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    clearTimeout(hideTimer);
                    $('#referfriend-invitation-content .modal-copysuccess').show();
                    hideTimer = setTimeout(() => {
                        $('.modal-copysuccess').fadeOut(300);
                    }, 3000);
                })
                .catch((err) => console.error('copyerr:', err));
        }
        const showError = (error) => {
            clearTimeout(hideTimer);
            $('.dlio-error').text("error:" + error)
            $('.dlio-error').show()
            hideTimer = setTimeout(() => {
                $('#referfriend-invitation-content .dlio-error').fadeOut(300);
            }, 3000);
        }
        // 复制邀请码
        $('.gameplay-box-copycode .copy-wrap').click(function () {
            const copyText = $(this).closest('.copy-code-top').find('.code-top').text()
            copyTextToClipboard(copyText)
            //复制顶部邀请码埋点
            isLoginPriont('老带新，复制邀请码', 'copy-code', '');
            isLoginPriont('老带新，复制邀请码+复制链接', '1', '')
        });

        $('.gameplay-box-copycode .invitation-product__copy-btn').click(function () {
            if (!getLoginStatus) {
                jumpLoginPage()
                return
            }
            const url = $(this).data('url');
            copyTextFallback(url);
            $('#referfriend-invitation-content .modal-copysuccess').show();
            setTimeout(() => {
                $('#referfriend-invitation-content .modal-copysuccess').fadeOut(300);
            }, 3000);

            var index = $(this).closest('.gameplay-box-item').index();
            // 埋点
            switch (index) {
                case 1:
                    isLoginPriont('老带新，点击a10', 'copy-url', '');
                    break;
                case 2:
                    isLoginPriont('老带新，点击A3', 'copy-url', '');
                    break;
                case 3:
                    isLoginPriont('老带新，点击面罩', 'copy-url', '');
                    break;
            }

            isLoginPriont('老带新，复制邀请码+复制链接', '2', '')
        });




        // 通用点击事件绑定函数
        function bindClickEvent(selector, handler) {
            $(selector).click(handler);
        }

        // 打开提现弹窗
        bindClickEvent('.withdraw-btn', (event) => {
            if (!getLoginStatus) {
                jumpLoginPage()
                return
            }
            
            event.stopPropagation();
            //判断是否在佣金详情页
            if (!$('.tabs').is(':visible')) {
                //首页点击提现埋点
                isLoginPriont('老带新，我的奖励，点击提现', 'withdraw-btn', '')
            } else {
                //佣金页点击提现埋点
                isLoginPriont('老带新，佣金页，点击提现', 'withdraw-btn', '')
            }
            let emailVal = $('.withdraw .ped-price-total').text().replace('$', '');
            if (Number(emailVal) > 0) {
                $('.modal-mask,.modal-container').fadeIn(200);
            } else {
                showError('The current amount does not support withdrawal')
            }

        });

        // 关闭提现弹窗
        function closeDeliBox() {
            $('.modal-mask, .modal-container').fadeOut(200);
            $('.modal-body').fadeOut(200);
        }
        bindClickEvent('.modal-close', () => {
            if ($('.modal-body').is(':visible')) {
                //查询提现记录
                renderWithdrawRecords()
            }
            closeDeliBox()
        });

        // 倒计时按钮逻辑，禁用按钮并显示剩余时间
        let isCooldown = false; // 标记是否正在倒计时中
        function startCountdown($button, duration) {
            if (isCooldown) return; // 已经在倒计时中，忽略点击
            let timeLeft = duration;
            isCooldown = true;
            $button.prop('disabled', true);
            const countdownTimer = setInterval(() => {
                $button.text(`sent（${timeLeft}）`);
                if (timeLeft-- <= 0) {
                    clearInterval(countdownTimer);
                    isCooldown = false; // 倒计时结束，允许再次点击
                    $button.text('Get code').prop('disabled', false);
                }
            }, 1000);
        }

        // 获取验证码按钮点击事件，触发倒计时
        $('#referfriend-invitation-content .getcode').click(function () {
            if ($('.email-error').is(':visible')) {
                return
            }

            // 获取验证码
            const emailVal = $('.withdrawal-email').val().trim();
            window.UlikeCommon.sendUlikeApi('/user/sendCode', {
                userEmail: emailVal,
                since: "USER_WITHDRAW",
            }).then(() => {
                startCountdown($(this), 60);
            }).catch((error) => {
                console.log('error', error);

                showError(error)
            });

        });

        // 邮箱格式校验，使用正则表达式
        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // 切换输入框校验状态样式（有效/无效）
        function toggleValidationState(selector, isValid) {
            $(selector).toggleClass('valid', isValid).toggleClass('invalid', !isValid);
        }

        // 验证码校验，并在通过时展示提现成功操作
        function validCodeFun() {
            const emailVal = $('.withdrawal-email').val().trim();
            const getcode = $('.withdrawal-code').val().trim();
            const isValid = getcode !== "" && getcode.length === 6;
            toggleValidationState('.withdrawal-code', isValid);

            if (isValid) {
                // 验证成功后请求提现
                window.UlikeCommon.sendUlikeApi('/user/me/withdraw', {
                    "withdrawAccountType": "PAYPAL_EMAIL",
                    withdrawAccountId: emailVal,
                    verifyCode: getcode,
                }).then((res) => {
                    if (res.message == "user_sys_verify_code_invalid") {
                        toggleValidationState('.withdrawal-code', false);
                        $('#referfriend-invitation-content .code-error').show();
                    }
                    if (res.success) {
                        $('.modal-header').hide();
                        $('.modal-container').css('height', '344px');
                        $('.modal-body').fadeIn(200);
                        $('#referfriend-invitation-content .withdraw .ped-price-total').text('$0');
                        //提现成功埋点
                        isLoginPriont('老带新，提现页，进入提现成功页', 'info-successPage', '')
                    }

                }).catch(error => {
                    console.log('error', error);
                });
            }
        }
        //显示详情页方法
        const showDatilPage = () => {
            if (!getLoginStatus) {
                jumpLoginPage()
                return
            }
            $('#refer-friend-banner').hide();
            $('.rewards-more, .gameplay-box-copycode, .gameplay-box-top, .invitation-record-batch .title').hide();
            $('#shopify-section-template--19132149956849__30698451-389d-43ce-b548-827c55ad66c4').hide();
            $('.tabs-title, .tabs').show();
            $('#referfriend-invitation-content .is-normal-render').show();
            $('#referfriend-invitation-content .invitation-record-batch').show();
            $('.refer-friend-steps').hide();
            $('.referfriend-faq').hide();
            $('.u-referral-storise').hide();
        }
        //验证邮箱结果显示隐藏
        function emailErrorShowOrHide(val) {
            if (!val) {
                $('#referfriend-invitation-content .email-default').hide()
                $('#referfriend-invitation-content .email-error').show()
            } else {
                $('#referfriend-invitation-content .email-default').show()
                $('#referfriend-invitation-content .email-error').hide()
            }
        }
        //邮箱边输入边校验
        $('.withdrawal-email').on('input', function () {
            const emailVal = $('.withdrawal-email').val().trim();
            const isValidEmail = emailVal !== "" && validateEmail(emailVal);
            toggleValidationState('.withdrawal-email', isValidEmail);
            emailErrorShowOrHide(isValidEmail)
            //输入邮箱埋点
            pblicStaFliter('老带新，提现页，输入邮箱', 'input-email', '')
        });
        //验证码输入埋点
        $('.withdrawal-code').on('input', function () {
            //输入验证码埋点
            pblicStaFliter('老带新，提现页，输入验证码', 'input-code', '')
        });
        // 提交按钮点击事件：先校验邮箱，再校验验证码
        $('#referfriend-invitation-content .submit-btn').click(() => {
            const emailVal = $('.withdrawal-email').val().trim();
            const isValidEmail = emailVal !== "" && validateEmail(emailVal);
            toggleValidationState('.withdrawal-email', isValidEmail);

            if (isValidEmail) validCodeFun();
        });
        // 提现成功后查看详情
        $('#referfriend-invitation-content .success-btn').click(() => {
            closeDeliBox()
            showDatilPage()
            //查询提现记录
            renderWithdrawRecords()
        });
        //点击more按钮 查看佣金明细，切换页面展示逻辑
        $('#referfriend-invitation-content .price-area,.rewards-more').click(event => {
            if (!event.target.classList.contains('withdraw-btn')) {
                showDatilPage()
            }
            //已登录点击更多 金额区域埋点 
            isLoginPriont('老带新，我的奖励，点击更多', 'more-btn', '')
        });

        // 渲染邀请列表函数
        async function renderOrderData() {
            // 查询首页查询邀请记录
            const inviteList = await window.UlikeCommon.sendUlikeApi('/promotion/queryBenefitInfoList', {
                activityId: activityId,
                activityType: "INVITE_NEW_ACTIVITY",
                includeCount: true,
                pageIndex: 1,
                pageSize: 20,
                since: "INVITE_HOME",
                // siteCode: "TEST",
            });
            const $list = $('#invitation-record-list').empty();
            if (!inviteList.data || inviteList.data.length == 0) {
                $list.append(`
                <p class="no-record">
                    There is no record for the moment.
                </p>`);
                if (!$('.tabs').is(':visible')) {
                    $('#referfriend-invitation-content .invitation-record-batch').hide();
                }
                return
            }
            inviteList.data.forEach((order, index) => {
                const extraClass = index > 0 ? 'is-normal-render' : '';
                $list.append(`
                <div class="render-area ${extraClass}">
                    <div class="description-text">
                        <div class="description-title">
                            <p class="order-num">Orders</p><p>Settlement time</p><p>Purchase Time</p><p>Subscribers</p><p>Order Status</p>
                        </div>
                        <div class="description-data">
                            <p class="order-num">${order.extend.orderInfo.orderName}</p><p>${timeToYear(order.endTime)}</p><p>${timeToYear(order.extend.orderInfo.createTime)}</p>
                            <p>${order.userEmail}</p><p class="order-status-red">${invivtStatusText(order.benefitStatus)}</p>
                        </div>
                    </div>
                    <div class="description-product">
                        <div class="description-title"><img src="${order.extend.orderInfo.orderItem[0].variant.image.url}" alt="Ulike Air 10" width="100%" height="100%"></div>
                        <div class="description-data">
                            <p class="order-num">${order.extend.orderInfo.orderItem[0].title}</p>
                            <div class="price-detail">
                                <div class="order-amount"><span>Order Amount<a class="show-symbol">:</a></span><br class="hidden-br"/><span class="order-status-red">${order.extend.orderInfo.totalPrice}</span></div>
                                <div class="order-commission"><span>Commission<a class="show-symbol">:</a></span><br class="hidden-br"/><span class="order-status-red">${order.extend.commissionAmount}</span></div>
                            </div>
                        </div>
                    </div>
                </div>`);
                $('#referfriend-invitation-content .is-normal-render').hide();
            });
        }
        //邀请记录状态转换
        const invivtStatusText = (benefitStatus) => {
            switch (benefitStatus) {
                case 'SUCCESS':
                    return 'Commission settled';
                case 'PENDING':
                    return 'Payment successful, commission to be settled';
                default:
                    return 'Order refund, invalid';
            }
        };
        //提现记录状态转换
        const WithdStatusText = (benefitStatus) => {
            switch (benefitStatus) {
                case 'SUCCESS':
                    return 'Withdrawal successful';
                case 'PENDING':
                    return 'Withdrawing';
                default:
                    return 'Withdrawal failed';
            }
        };
        //时间转换器
        const timeToYear = (val) => {
            const timestamp = val;
            const date = new Date(timestamp * 1000); // 转为毫秒
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
            return formattedDateTime;
        };

        // 渲染提现记录列表函数
        async function renderWithdrawRecords() {
            // 查询提现记录
            const withdrawalRecord = await window.UlikeCommon.sendUlikeApi('/user/queryFundFlowList', {
                scene: "INVITE_FUND_FLOW",
                pageIndex: 1,
                pageSize: 20,
                includeCount: false,
                flowTypeList: ["WITHDRAW_SUBMITTED", "INVITE_REWARD_RECEIVED"]
            });
            const $list = $(".amount-record-list").empty();
            $('.amount-record-list').show()
            if (!withdrawalRecord.data || withdrawalRecord.data.length == 0) {
                // table-header
                //提现状态
                $list.append(`
                <p class="no-record">
                    There is no record for the moment.
                </p>`);
                return
            }
            let withdrawType = "";//提现类型
            let withdrawAmount = "";//提现金额
            let withdrawStatus = "";//提现状态
            let extraClass = "";//动态增加class
            $('#referfriend-invitation-content .table-header').show()


            withdrawalRecord.data.forEach(item => {
                //判断提现类型
                if (item.flowType == 'WITHDRAW_SUBMITTED') {
                    withdrawType = "Withdraw, account:" + item.extend.userFundWithdrawDto.withdrawAccountId
                    withdrawStatus = WithdStatusText(item.extend.userFundWithdrawDto.withdrawStatus)
                    if (item.extend.userFundWithdrawDto.withdrawStatus != 'FAILED') {
                        withdrawAmount = item.amount
                    } else {
                        withdrawAmount = '';
                        extraClass = 'withdraw-error';
                    }
                }
                if (item.flowType == 'INVITE_REWARD_RECEIVED') {
                    withdrawType = "Commission settlement"
                    withdrawAmount = '+' + Math.abs(item.amount)
                    withdrawStatus = ""
                }
                //提现状态
                $list.append(`
                <div class="table-content">
                    <div class="base-information"><p>${withdrawType}</p><p>${timeToYear(item.createTime)}</p></div>
                    <div class="base-price"><p>${withdrawAmount}</p><p id="${extraClass}">${withdrawStatus}</p></div>
                </div>`);
            });
        }

        // 文档就绪后执行：渲染订单和提现记录
        const activityId = '331522644954316801'
        
        // 调用示例：在需要初始化时执行
        initializeUserAccount().then(({ user, fund, activity }) => {

            console.log('初始化完成，用户:', user, '资金账户:', fund, '活动:', activity,);
            if (activity) {
                // 处理活动数据

                let inviteCouponCodeList = activity.data.extend.inviteCouponCodeList || []; 
                // $('#referfriend-invitation-content .invitation-product__copy-btn').attr("data-url",`https://www.ulike.com/products/sapphire-air-10-ipl-hair-removal?discount=${inviteCode}`);
                $('.gameplay-box-item').each((index, item) => {
                    const productId = $(item).attr('data-productId');
                    const productUrl = $(item).attr('data-url');
                    const productVariant = $(item).attr('data-variant'); 
                    const productData = inviteCouponCodeList.find(fitem => {  
                        return fitem.productIdList.includes(productId);
                    })

                    if (productData) {
                        $(item).find('.code-disscount span').text('$' + productData.discountAmount);
                        $(item).find('.code-top').text(productData.couponCode);
                        $(item).find('.invitation-product__copy-btn').attr("data-url", productVariant ? `${productUrl}?add-discount=${productData.couponCode}&variant=${productVariant}` : `${productUrl}?add-discount=${productData.couponCode}`); 
                        $(item).find('.code-disscount').show();
                    }
                })
            }
            if (fund) {
                $('#referfriend-invitation-content .modal-price').text('$' + fund.data.availableAmount);
                $('#referfriend-invitation-content .pending .ped-price-total').text('$' + fund.data.freezeAmount);
                $('#referfriend-invitation-content .withdraw .ped-price-total').text('$' + fund.data.availableAmount);
            }


        })
            .catch(err => {
                console.error(err);
            });


        /**
         * 初始化用户、资金账户及活动记录
         * @param {string} activityId - 活动ID，用于查询或新增活动项目
         * @returns {Promise<{user: Object, fund: Object, activity: Object}>}
         */
        async function initializeUserAccount() {
            try {
                // 登录用户账号
                const user = await window.UlikeCommon.sendUlikeApi('/user/queryLoginUserAccount', {});
                if (!user?.data?.userId) {
                    $('.invitation-record-batch').hide();
                    pblicStaFliter('老带新，浏览页面（未登录）', getLoginStatus, '');
                    return { user }; // 只返回 user
                } else {
                    getLoginStatus = true
                    pblicStaFliter('老带新，浏览页面（已登录）', getLoginStatus, '');
                }
                // 查询或创建资金账户
                const fund = await window.UlikeCommon.sendUlikeApi('/user/me/queryOrCreateFundAccount', { accountType: 'CASH' });
                // 查询或新增活动项目
                const activity = await window.UlikeCommon.sendUlikeApi('/promotion/queryOrAddActivityItem', {
                    activityType: 'INVITE_NEW_ACTIVITY',
                    activityId: activityId
                });

                // 查询邀请记录
                renderOrderData()
                return { user, fund, activity };
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
        // 获取所有标签和内容
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        // 默认激活第一个标签和内容
        tabs[0].classList.add('active');
        tabContents[0].classList.add('active');
        // 给每个标签绑定点击事件
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有标签和内容的 active 类
                tabs.forEach(tab => tab.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // 给当前点击的标签和相应的内容添加 active 类
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById('tab-content-' + tabId).classList.add('active');
                if (tabId == '1') {
                    isLoginPriont('老带新，佣金页，点击邀请记录', 'click-record', '')
                    //查询邀请记录
                    renderOrderData()
                }
                if (tabId == '2') {
                    isLoginPriont('老带新，佣金页，点击佣金明细', 'click-pricedetail', '')
                    //查询提现记录
                    $('#referfriend-invitation-content .table-header').hide()
                    $('.amount-record-list').hide()
                    renderWithdrawRecords()
                }
            });
        });


        //登录弹窗交互逻辑

        //邮箱输入框失去焦点校验提示信息
        $('#loginForm .login-email').blur(function () {
            const email = $(this).val().trim();

            // 邮箱地址为空,显示错误提示信息
            if (email === '') {
                window.UlikeCommon.commonGtmEvent('老带新，登录，邮箱不能为空')
                $('.form-group').eq(0).addClass('error');
                $('#emailError').text('Email cannot be empty');
            }

            // 错误邮箱地址，显示错误提示信息
            if (!validateEmail(email) && email !== '') {
                window.UlikeCommon.commonGtmEvent('老带新，登录，邮箱错误')
                $('.form-group').eq(0).addClass('error');
                $('#emailError').text('Invalid email address');
            }
        });

        //监听邮箱输入埋点事件
        $('#loginForm .login-email').one('input', function() {
            window.UlikeCommon.commonGtmEvent('老带新，登录，输入邮箱')
        });

          //监听密码输入埋点事件
          $('#loginForm .login-password').one('input', function() {
            window.UlikeCommon.commonGtmEvent('老带新，登录，输入密码') 
        });

        //密码输入框失去焦点校验提示信息
        $('#loginForm .login-password').blur(function () {
            const password = $(this).val().trim();
            //密码校验
            if (!isValidPassword(password)) {
                if(password === ''){
                    window.UlikeCommon.commonGtmEvent('老带新，登录，密码不能为空')
                    $('#passwordError').text('Please enter the correct password');
                }else{
                    window.UlikeCommon.commonGtmEvent('老带新，登录，密码格式错误')
                    $('#passwordError').text('Your password requires 6-16 digits, and must contain letters and numbers');
                }
                $('.form-group').eq(1).addClass('error');
                
            }
        })

        //邮箱或密码输入值取消错误信息提示
        $('#loginForm .login-email,#loginForm .login-password').on('input', function () {
            $(this).closest('.form-group').removeClass('error').find('.error').text('');
        });

        let loading = false;
        //弹窗登录
        $('#loginForm').on('submit', function (e) {
            e.preventDefault();
            const email = $('.login-email').val().trim();
            const password = $('.login-password').val().trim();
            let valid = getValidResult(email, password);
            //校验通过
            if (valid) {
                login(email,password);
            }
        })

        //点击登录弹窗关闭按钮
        $('.login-modal-close').click(function () {
            loginModalClose()
        });

        //关闭登录弹窗
        function loginModalClose() {
            $('.login-modal').fadeOut(200);
            $('body').removeClass('no-scroll');
            // 清除校验提示和输入内容
            $('.form-group').each(function(index,item){
                $(item).removeClass('error').find('.error').text('');
                $(item).find('input').val('')
            })
        }

        // 密码正则 6-16位数字，并且必须包含字母和数字。
        function isValidPassword(password) {
            const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,16}$/;
            return regex.test(password);
        }

        //获取校验结果
        function getValidResult(email, password) {
            let valid = true;

            // 邮箱地址为空,显示错误提示信息
            if (email === '') {
                $('.form-group').eq(0).addClass('error');
                $('#emailError').text('Email cannot be empty');
                valid = false;
            }

            // 错误邮箱地址，显示错误提示信息
            if (!validateEmail(email) && email !== '') {
                $('.form-group').eq(0).addClass('error');
                $('#emailError').text('Invalid email address');
                valid = false;
            }

            //密码校验
            if (!isValidPassword(password)) {
                $('.form-group').eq(1).addClass('error');
                $('#passwordError').text('Your password requires 6-16 digits, and must contain letters and numbers');
                valid = false;
            }

            return valid;

        }

        //登录
        function login(email,password){
            if(loading){
                return
            }
            const params = {
                "siteCode":"US",
                "userEmail": email,
                "passWord": password,
                "since":"LOTTERY_LOGIN",
                "returnUrl": location.href 
            }
            window.UlikeCommon.commonGtmEvent('老带新，登录，点击提交')
            showLoading()
            window.UlikeCommon.sendUlikeApi('/user/login',params).then(res => {
                const {code,data } = res
                if(code === 0){
                    location.href = data.loginUrl
                }else{
                    $('.form-group').eq(1).addClass('error');
                    $('#passwordError').text('Please enter the correct password');
                    hideLoading()
                }
                
            }).catch(err => {
                console.log('登录失败',err) 
                hideLoading()
            })
        }
        //显示 loading
        function showLoading(){
            loading = true
            $('.form-submit').find('span').hide()
            $('.form-submit').find('.loading-icon').show();
            $('.form-submit').addClass('disabled')
        }
         //隐藏 loading
        function hideLoading(){
            loading = false
            $('.form-submit').find('span').show()
            $('.form-submit').find('.loading-icon').hide();
            $('.form-submit').removeClass('disabled')
        }






        // 全局函数：关闭全部邀请弹窗
        window.closeAll = () => $('#referfriend-invitation-content').hide();
    });
})();
