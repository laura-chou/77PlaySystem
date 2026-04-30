'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import styles from '@/styles/modules/customer.module.scss';

import api from '@/lib/api';
import { ICustomer, ICustomerFormData, ActionEnum } from '@/lib/models/customer';


export default function CustomerEdit() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<ICustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<ICustomerFormData>({
        action: ActionEnum.CHARGE,
        custId: customerId,
        custName: '',
        amount: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [action, setAction] = useState<ActionEnum>(ActionEnum.NAME);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [extendCount, setExtendCount] = useState(0);

    useEffect(() => {
        if (customerId) {
            fetchCustomer();
        }
    }, [customerId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // only name is editable in upper block
        if (action === ActionEnum.NAME) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const fetchCustomer = async() => {
        try {
            setLoading(true);
            const response = await api.get(
                `customer/${customerId}`
            );

            const responseData = response.data.data;

            // Ensure dates are properly formatted
            const today = new Date().toISOString().split('T')[0];
            const createDate = responseData.createDate ? new Date(responseData.createDate).toISOString().split('T')[0] : today;
            const expiryDate = responseData.history[0].expiryDate ? new Date(responseData.history[0].expiryDate).toISOString().split('T')[0] : today;
            const customerData = {
                custId: customerId,
                custName: responseData.custName,
                createDate: createDate,
                extendedTimes: responseData.extendedTimes || 0,
                balance: responseData.history[0].currentBalance,
                balanceExpiryDate: expiryDate,
                history: responseData.history
            };
            setCustomer(customerData);
            setExtendCount(responseData.extendedTimes || 0);

            const newFormData = {
                action: action,
                custId: customerData.custId,
                custName: customerData.custName,
                amount: 0
            };

            setFormData(newFormData);
        } catch (error) {
            // If token is invalid, redirect to login
            if (api.isAxiosError(error) && error.response?.status === 401) {
                alert('驗證失效，請重新登入');
                router.push('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async() => {
        if (!formData.custName.trim()) {
            alert('請輸入客戶 LINE');
            return;
        }
        try {
            // Prepare the data to send
            const dataToSend = { ...formData };
            setAction(action);
            dataToSend.action = action;

            // Apply balance operations if amount is provided
            if (balanceAmount > 0 || action === 'refill' || action === 'extend' || action === 'name') {
                const amountToUse = action === 'name' ? 0 : balanceAmount;

                switch (action) {

                    case 'charge':
                    case 'refill':
                    case 'extend':
                        dataToSend.amount = amountToUse;
                        break;
                    case 'name':
                        // For name action, no balance change is made
                        dataToSend.custName = formData.custName;
                        dataToSend.amount = 0;
                        break;
                }
            }

            await api.patch(
                `customer/update`,
                dataToSend
            );

            // Fetch updated customer data after successful update
            await fetchCustomer();
            setIsEditing(false);
            setBalanceAmount(0);
            alert('客戶資料已更新！');
        } catch (error) {
            console.error('Failed to update customer:', error);
            // Handle 401 error specifically
            if (api.isAxiosError(error) && error.response?.status === 401) {
                alert('驗證失效，請重新登入');
                router.push('/');
                return;
            }
            alert('更新失敗，請重試');
        }
    };

    const filteredHistory = customer?.history.filter(h => {
        if (!historyStartDate && !historyEndDate) return true;
        const spendDate = new Date(h.spendDate);
        const start = historyStartDate ? new Date(historyStartDate) : null;
        const end = historyEndDate ? new Date(historyEndDate) : null;

        if (start && spendDate < start) return false;
        if (end && spendDate > end) return false;
        return true;
    }) || [];

    const handleCancel = () => {
        if (customer) {
            setFormData({
                action: ActionEnum.CHARGE,
                custId: customer.custId,
                custName: customer.custName,
                amount: customer.history[0].currentBalance || 0
            });
        }
        setIsEditing(false);
        setBalanceAmount(0);
        setAction(ActionEnum.CHARGE);
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">載入中...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    找不到客戶資料
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => router.push('/pages/dashboard')}
                >
                    返回客戶清單
                </button>
            </div>
        );
    }

    return (
        <div className={`${styles.container}`}>
            <div className={`m-3 ${styles.customerDetail}`}>
                <div className='mb-3'>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push('/pages/dashboard')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        返回清單
                    </button>
                </div>
                <nav>
                    <div className="nav nav-pills nav-fill" id="nav-tab" role="tablist">
                        <button className="nav-link fw-bold active" id="customer-tab" data-bs-toggle="tab" data-bs-target="#nav-customer" type="button" >客戶資料</button>
                        <button className="nav-link fw-bold" id="history-tab" data-bs-toggle="tab" data-bs-target="#nav-history" type="button">歷史紀錄</button>
                    </div>
                </nav>
                <div className="tab-content" id="nav-tabContent">
                    <div className="tab-pane fade show active" id="nav-customer" >
                        <div className="mt-2 mb-2">
                            <label className="col-form-label px-1">客戶 LINE：</label>
                            <input
                                type="text"
                                className="form-control"
                                name="custName"
                                value={formData.custName}
                                onChange={handleInputChange}
                                disabled={!isEditing || (isEditing && action !== 'name')}
                            />
                        </div>

                        <div className="mb-2">
                            <label className="col-form-label px-1">加入日期：</label>
                            <input
                                type="date"
                                className="form-control"
                                name="createDate"
                                value={customer.createDate}
                                disabled={true}
                            />
                        </div>

                        <div className="mb-2">
                            <label className="col-form-label px-1">當前餘額：</label>
                            <input
                                type="number"
                                className="form-control"
                                name="amount"
                                value={customer.balance}
                                disabled={true}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="col-form-label px-1">餘額到期日：</label>
                            <input
                                type="date"
                                className="form-control"
                                name="expiryDate"
                                value={customer.balanceExpiryDate}
                                disabled={true}
                            />
                        </div>

                        {isEditing && (
                            <>
                                <div><hr /></div>
                                <div className="mb-2">
                                    <label className="col-form-label px-1">操作類型：</label>
                                    <select
                                        className="form-select"
                                        value={action}
                                        onChange={(e) => {
                                            const selectedAction = e.target.value as ActionEnum;
                                            const defaultAmount = 0;
                                            setAction(selectedAction as ActionEnum);

                                            if (selectedAction === ActionEnum.REFILL) setBalanceAmount(1500);
                                            else if (selectedAction === ActionEnum.EXTEND) setBalanceAmount(200);
                                            else if (selectedAction === ActionEnum.CHARGE) setBalanceAmount(80);

                                            setFormData(prev => ({
                                                ...prev,
                                                action: selectedAction,
                                                amount: defaultAmount
                                            }));
                                        }}
                                    >
                                        <option value="name">改客戶 LINE</option>
                                        <option value="charge">消費</option>
                                        <option value="refill">充值</option>
                                        {(() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const expiryDate = new Date(customer.balanceExpiryDate);
                                            expiryDate.setHours(0, 0, 0, 0);
                                            const isExpired = expiryDate < today;
                                            const canExtend = isExpired && extendCount < 3;
                                            const dateStr = customer.balanceExpiryDate.replace(/-/g, '/');

                                            return (
                                                <option value="extend" disabled={!canExtend}>
                                                    延長到期日 {
                                                        extendCount >= 3 ? '(已達上限 3 次)' :
                                                        !isExpired ? `(尚未到期，${dateStr} 後可選，目前 ${extendCount} 次)` :
                                                        `(目前 ${extendCount} 次)`
                                                    }
                                                </option>
                                            );
                                        })()}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="col-form-label px-1">金額：</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={action === 'name' ? 0 : balanceAmount}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            if (action === 'extend') {
                                                setBalanceAmount(Math.max(0, value));
                                            } else if (action === 'charge') {
                                                // For charge, round to nearest 80
                                                const roundedValue = Math.round(value / 80) * 80;
                                                setBalanceAmount(roundedValue);
                                            } else {
                                                // For other actions, round to nearest 100
                                                const roundedValue = Math.round(value / 100) * 100;
                                                setBalanceAmount(roundedValue);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (!/[0-9]/.test(e.key) &&
                                                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        step={action === 'charge' ? 80 : 100}
                                        min={action === 'charge' ? 80 : 100}
                                        placeholder={action === 'charge' ? '請輸入金額 (80的倍數)' : '請輸入金額 (100的倍數)'}
                                        disabled={action === 'name' || action === 'extend'}
                                    />
                                </div>
                            </>
                        )}

                        <div className="d-flex justify-content-end gap-2">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    編輯
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleSave}
                                    >
                                        <i className="bi bi-check me-2"></i>
                                        儲存
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancel}
                                    >
                                        <i className="bi bi-x me-2"></i>
                                        取消
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="tab-pane fade" id="nav-history">
                        <div className="row mt-3 mb-2 px-1">
                            <div className="col-6">
                                <label htmlFor="historyStartDate" className="form-label small">開始日期</label>
                                <input
                                    id="historyStartDate"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={historyStartDate}
                                    onChange={(e) => setHistoryStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <label htmlFor="historyEndDate" className="form-label small">結束日期</label>
                                <input
                                    id="historyEndDate"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={historyEndDate}
                                    onChange={(e) => setHistoryEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <table className={`table table-bordered text-center mb-0`}>
                            <thead>
                                <tr className='table-success'>
                                    <th>日期</th>
                                    <th>消費星星</th>
                                    <th>剩餘星星</th>
                                    <th>到期日</th>
                                    <th>餘額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((history, index) => {
                                    let stars: number;

                                    if (history.currentBalance === history.amount) {
                                        // 初始紀錄特殊邏輯
                                        stars = 15;
                                    } else {
                                        // 一般星星計算：$80/星，四捨五入（負數 .5 往遠離 0 方向捨入）
                                        const rawStars = history.amount / 80;
                                        stars = Math.sign(rawStars) * Math.round(Math.abs(rawStars));
                                    }

                                    const displayStars = stars > 0 ? `+${stars}` : stars.toString();

                                    return (
                                    <tr key={`${history.spendDate}-${index}`}>
                                        <td>{history.spendDate}</td>
                                        <td className='text-end'>{displayStars}</td>
                                        <td className='text-end'>{Math.round(history.currentBalance / 80)}</td>
                                        <td>{history.expiryDate}</td>
                                        <td className='text-end'>{history.currentBalance.toLocaleString()}</td>
                                    </tr>
                                    );
                                })}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-3 text-muted">無符合條件的紀錄</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
