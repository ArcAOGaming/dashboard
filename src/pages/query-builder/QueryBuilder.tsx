import React, { useState, useEffect } from 'react';
import { ArweaveGQLBuilder, ArweaveGQLSortOrder } from 'ao-process-clients/dist/src/core/arweave/gql';
import { ArweaveDataService } from 'ao-process-clients/dist/src/core/arweave';
import { ProcessIdSidebar } from './components/ProcessIdSidebar';
import './QueryBuilder.css';

interface Tag {
  name: string;
  value: string;
}

interface QueryFields {
  owner: boolean;
  recipient: boolean;
  tags: boolean;
  block: boolean;
  data: boolean;
  fee: boolean;
  quantity: boolean;
}

export function QueryBuilder() {
  const [id, setId] = useState('');
  const [owner, setOwner] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [limit, setLimit] = useState(10);
  const [fields, setFields] = useState<QueryFields>({
    owner: true,
    recipient: true,
    tags: true,
    block: true,
    data: true,
    fee: true,
    quantity: true,
  });
  const [queryResult, setQueryResult] = useState('');
  const [queryResponse, setQueryResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'response'>('query');
  const [isLoading, setIsLoading] = useState(false);
  const queryButtonRef = React.useRef<HTMLButtonElement>(null);
  const responseButtonRef = React.useRef<HTMLButtonElement>(null);

  const addTag = () => {
    if (newTagName && newTagValue) {
      const newTags = [...tags, { name: newTagName, value: newTagValue }];
      setTags(newTags);
      setNewTagName('');
      setNewTagValue('');
      generateQuery(newTags, fields, id, owner, recipient, limit);
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    generateQuery(newTags, fields, id, owner, recipient, limit);
  };

  const generateQuery = (
    currentTags: Tag[] = tags,
    currentFields: QueryFields = fields,
    currentId: string = id,
    currentOwner: string = owner,
    currentRecipient: string = recipient,
    currentLimit: number = limit
  ) => {
    const builder = new ArweaveGQLBuilder();

    if (currentId) builder.id(currentId);
    if (currentOwner) builder.owner(currentOwner);
    if (currentRecipient) builder.recipient(currentRecipient);
    if (currentTags.length > 0) builder.tags(currentTags);
    if (currentLimit > 0) builder.limit(currentLimit);

    // Add selected fields
    if (currentFields.owner) builder.withOwner();
    if (currentFields.recipient) builder.withRecipient();
    if (currentFields.tags) builder.withTags();
    if (currentFields.block) builder.withBlock();
    if (currentFields.data) builder.withData();
    if (currentFields.fee) builder.withFee();
    if (currentFields.quantity) builder.withQuantity();

    builder.sortBy(ArweaveGQLSortOrder.HEIGHT_DESC);

    const query = builder.build();
    setQueryResult(JSON.stringify(query, null, 2));
    return builder;
  };

  const executeQuery = () => {
    setIsLoading(true);
    setActiveTab('response');
    
    const builder = generateQuery();
    const dataService = ArweaveDataService.autoConfiguration();
    dataService.query(builder)
      .then(response => {
        setQueryResponse(response);
      })
      .catch(error => {
        console.error('Query execution error:', error);
        setQueryResponse({ error: error.message });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const toggleField = (field: keyof QueryFields) => {
    const newFields = { ...fields, [field]: !fields[field] };
    setFields(newFields);
    generateQuery(tags, newFields, id, owner, recipient, limit);
  };

  // Generate query whenever form fields change
  useEffect(() => {
    generateQuery();
  }, [id, owner, recipient, limit]);

  return (
    <div className="query-builder-container">
      <div className="query-builder">
        <h2>Arweave GraphQL Query Builder</h2>
        
        <div className="query-builder-form">
          <div className="form-section">
            <h3>Filters</h3>
            
            <div className="form-group">
              <label>Transaction ID</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>

            <div className="form-group">
              <label>Owner Address</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Enter owner address"
              />
            </div>

            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter recipient address"
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-list">
                {tags.map((tag, index) => (
                  <div key={index} className="tag-item">
                    <span>{tag.name}:{tag.value}</span>
                    <button onClick={() => removeTag(index)}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                />
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="Tag value"
                />
                <button className="secondary-button" onClick={addTag}>Add Tag</button>
              </div>
            </div>

            <div className="form-group">
              <label>Limit</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Fields to Include</h3>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.owner}
                  onChange={() => toggleField('owner')}
                  id="field-owner"
                />
                <label htmlFor="field-owner">Owner</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.recipient}
                  onChange={() => toggleField('recipient')}
                  id="field-recipient"
                />
                <label htmlFor="field-recipient">Recipient</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.tags}
                  onChange={() => toggleField('tags')}
                  id="field-tags"
                />
                <label htmlFor="field-tags">Tags</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.block}
                  onChange={() => toggleField('block')}
                  id="field-block"
                />
                <label htmlFor="field-block">Block</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.data}
                  onChange={() => toggleField('data')}
                  id="field-data"
                />
                <label htmlFor="field-data">Data</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.fee}
                  onChange={() => toggleField('fee')}
                  id="field-fee"
                />
                <label htmlFor="field-fee">Fee</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  checked={fields.quantity}
                  onChange={() => toggleField('quantity')}
                  id="field-quantity"
                />
                <label htmlFor="field-quantity">Quantity</label>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="primary-button" onClick={executeQuery}>
              Query
            </button>
          </div>
        </div>

        <div className="query-results">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'query' ? 'active' : ''}`}
              onClick={() => setActiveTab('query')}
            >
              Generated Query
            </div>
            <div 
              className={`tab ${activeTab === 'response' ? 'active' : ''}`}
              onClick={() => setActiveTab('response')}
            >
              Query Response
            </div>
          </div>
          
          <div className="tab-content">
            {activeTab === 'query' && queryResult && (
              <div className="query-result">
                <button 
                  ref={queryButtonRef}
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(queryResult);
                    if (queryButtonRef.current) {
                      queryButtonRef.current.classList.add('copied');
                      queryButtonRef.current.textContent = 'Copied!';
                      setTimeout(() => {
                        if (queryButtonRef.current) {
                          queryButtonRef.current.classList.remove('copied');
                          queryButtonRef.current.textContent = 'Copy';
                        }
                      }, 2000);
                    }
                  }}
                >
                  Copy
                </button>
                <pre>{queryResult}</pre>
              </div>
            )}
            
            {activeTab === 'response' && (
              <div className="query-result">
                {isLoading ? (
                  <div className="loading-indicator">
                    Executing query...
                  </div>
                ) : (
                  queryResponse && (
                    <>
                      <button 
                        ref={responseButtonRef}
                        className="copy-button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(queryResponse, null, 2));
                          if (responseButtonRef.current) {
                            responseButtonRef.current.classList.add('copied');
                            responseButtonRef.current.textContent = 'Copied!';
                            setTimeout(() => {
                              if (responseButtonRef.current) {
                                responseButtonRef.current.classList.remove('copied');
                                responseButtonRef.current.textContent = 'Copy';
                              }
                            }, 2000);
                          }
                        }}
                      >
                        Copy
                      </button>
                      <pre>{JSON.stringify(queryResponse, null, 2)}</pre>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ProcessIdSidebar />
    </div>
  );
}
