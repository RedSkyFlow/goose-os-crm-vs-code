import React, { useState, useEffect, useMemo } from 'react';
import type { Company, Contact, Deal, Interaction } from '../../types';
import { fetchCompanies, fetchContacts, fetchDeals, fetchInteractions } from '../../services/apiService';
import { BuildingOfficeIcon, UsersIcon, BriefcaseIcon, FireIcon, ExclamationTriangleIcon, KeyIcon } from '../icons';
import { Timeline } from '../Timeline';
import { CompanyFormModal } from './CompanyFormModal';
import { useNotification } from '../../contexts/NotificationContext';
import { MasterListSidebar } from '../MasterListSidebar';
import { RightSidebar } from '../RightSidebar';
import type { NavigationTarget } from '../GooseOS';
import type { Hub } from '../MainNavbar';

interface CompaniesHubProps {
    navigationTarget: NavigationTarget | null;
    onNavigate: (hub: Hub, itemId: string) => void;
}

export const CompaniesHub: React.FC<CompaniesHubProps> = ({ navigationTarget, onNavigate }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [relatedData, setRelatedData] = useState<{ contacts: Contact[], deals: Deal[], interactions: Interaction[] }>({ contacts: [], deals: [], interactions: [] });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('All');

    const { showToast } = useNotification();

    // 1. Fetch Companies List
    useEffect(() => {
        const loadCompanies = async () => {
            try {
                setIsLoading(true);
                const data = await fetchCompanies();
                setCompanies(data);
                if (data.length > 0 && !selectedCompany) {
                    setSelectedCompany(data[0]);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load companies'); // FIX: Removed 2nd arg
            } finally {
                setIsLoading(false);
            }
        };
        loadCompanies();
    }, []);

    // 2. Handle Navigation Targets (Deep Linking)
    useEffect(() => {
        if (navigationTarget?.hub === 'Companies' && companies.length > 0) {
            const target = companies.find(c => c.company_id === navigationTarget.itemId);
            if (target && target.company_id !== selectedCompany?.company_id) {
                setSelectedCompany(target);
            }
        }
    }, [navigationTarget, companies]);

    // 3. Fetch Related Data (Ghost Data Fix + Toast Fix)
    useEffect(() => {
        if (!selectedCompany) {
             setRelatedData({ contacts: [], deals: [], interactions: [] });
             return;
        }

        // FIX: Clear previous data IMMEDIATELY to prevent "Ghost Data"
        setRelatedData({ contacts: [], deals: [], interactions: [] });
        
        const loadRelatedData = async () => {
            setIsLoadingDetails(true);
            try {
                const [contacts, deals, interactions] = await Promise.all([
                    fetchContacts(selectedCompany.company_id),
                    fetchDeals({ companyId: selectedCompany.company_id }),
                    fetchInteractions({ companyId: selectedCompany.company_id })
                ]);
                setRelatedData({ contacts, deals, interactions });
            } catch (err) {
                console.error(err);
                showToast('Failed to load company details'); // FIX: Removed 2nd arg
            } finally {
                setIsLoadingDetails(false);
            }
        };

        loadRelatedData();
    }, [selectedCompany, showToast]);

    const handleCompanyCreated = (newCompany: Company) => {
        setCompanies(prev => [newCompany, ...prev]);
        setSelectedCompany(newCompany);
        setIsModalOpen(false);
        showToast('Company created successfully');
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.domain.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [companies, searchTerm]);

    const renderListItem = (company: Company) => (
        <div className="flex justify-between items-start">
            <div>
                <h3 className={`font-medium ${selectedCompany?.company_id === company.company_id ? 'text-white' : 'text-foreground'}`}>
                    {company.name}
                </h3>
                <p className={`text-xs ${selectedCompany?.company_id === company.company_id ? 'text-white/70' : 'text-foreground/50'}`}>
                    {company.domain}
                </p>
            </div>
            {company.status === 'at_risk' && <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />}
            {company.status === 'hot' && <FireIcon className="h-4 w-4 text-accent" />}
        </div>
    );

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
    };

    const MainContent = () => {
        if (!selectedCompany) return <div className="flex-1 flex items-center justify-center text-foreground/50">Select a company</div>;

        if (isLoadingDetails) {
            return (
                <main className="flex-1 flex items-center justify-center bg-background">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
                </main>
            );
        }

        return (
            <main className="flex-1 overflow-y-auto bg-background p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{selectedCompany.name}</h1>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-foreground/60">
                                <span className="flex items-center">
                                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                    {selectedCompany.industry}
                                </span>
                                <a href={`https://${selectedCompany.domain}`} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
                                    {selectedCompany.domain}
                                </a>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors font-medium">
                            Edit Details
                        </button>
                    </div>

                    {/* AI Summary Card */}
                    <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                            <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Goose Intel</h3>
                        </div>
                        <p className="text-foreground/90 leading-relaxed">
                            {selectedCompany.ai_summary || "Goose hasn't analyzed this company yet. Ask the Co-Pilot to run a report."}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-background-light p-4 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-foreground/60">Active Deals</span>
                            <BriefcaseIcon className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">{relatedData.deals.length}</div>
                    </div>
                    <div className="bg-background-light p-4 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-foreground/60">Key Contacts</span>
                            <UsersIcon className="h-5 w-5 text-accent" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">{relatedData.contacts.length}</div>
                    </div>
                    <div className="bg-background-light p-4 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-foreground/60">Health Score</span>
                            <div className={`h-2 w-2 rounded-full ${relatedData.deals.some(d => d.ai_health_score < 50) ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {relatedData.deals.length > 0 ? Math.round(relatedData.deals.reduce((acc, d) => acc + d.ai_health_score, 0) / relatedData.deals.length) : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Contacts Column */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Contacts</h3>
                            <button className="text-xs text-secondary hover:text-secondary/80 font-medium">+ Add Contact</button>
                        </div>
                        <div className="space-y-3">
                            {relatedData.contacts.length === 0 ? (
                                <p className="text-sm text-foreground/40 italic">No contacts found.</p>
                            ) : (
                                relatedData.contacts.map(contact => (
                                    <div key={contact.contact_id} className="flex items-center p-3 bg-background-light rounded-lg border border-white/5 hover:border-primary/30 transition-colors cursor-pointer">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
                                            {contact.first_name[0]}{contact.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">{contact.first_name} {contact.last_name}</div>
                                            <div className="text-xs text-foreground/60">{contact.role}</div>
                                        </div>
                                        {contact.status === 'key_decision_maker' && <KeyIcon className="h-4 w-4 text-accent ml-auto" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Deals Column */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Active Deals</h3>
                            <button 
                                onClick={() => onNavigate('Deals', '')} // Just navigate to deals hub
                                className="text-xs text-secondary hover:text-secondary/80 font-medium"
                            >
                                + Create Deal
                            </button>
                        </div>
                        <div className="space-y-3">
                            {relatedData.deals.length === 0 ? (
                                <p className="text-sm text-foreground/40 italic">No active deals.</p>
                            ) : (
                                relatedData.deals.map(deal => (
                                    <div 
                                        key={deal.deal_id} 
                                        onClick={() => onNavigate('Deals', deal.deal_id)}
                                        className="p-4 bg-background-light rounded-lg border border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-foreground">{deal.deal_name}</h4>
                                            <span className={`px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20`}>
                                                {deal.stage}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-sm text-foreground/60">
                                                Est. Close: {new Date(deal.close_date_expected).toLocaleDateString()}
                                            </div>
                                            <div className="text-lg font-bold text-white">
                                                {/* Format value safely, defaulting to 0 */}
                                                {(deal.value || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground/90 mb-4">
                    Master Timeline
                </h3>
                <Timeline interactions={relatedData.interactions} isLoading={isLoadingDetails} />
            </main>
        )
    }

    return (
        <>
            <CompanyFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCompanyCreated={handleCompanyCreated}
            />
            <MasterListSidebar<Company>
                title="Companies"
                items={filteredCompanies}
                selectedItem={selectedCompany}
                onSelectItem={setSelectedCompany}
                renderListItem={renderListItem}
                onAddItem={() => setIsModalOpen(true)}
                isLoading={isLoading}
                itemIdentifier="company_id"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search companies..."
                filterOptions={[]}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
            />
            <MainContent />
            <RightSidebar item={selectedCompany} interactions={relatedData.interactions} />
        </>
    );
};