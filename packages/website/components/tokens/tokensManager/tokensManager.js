import Link from 'next/link';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useRouter } from 'next/router';

import TokenRowItem from './tokenRowItem';
import countly from 'lib/countly';
import Loading from 'components/loading/loading';
import Button from 'components/button/button';
import { useTokens } from 'components/contexts/tokensContext';
import Dropdown from 'ZeroComponents/dropdown/dropdown';
import Filterable from 'ZeroComponents/filterable/filterable';
import Sortable from 'ZeroComponents/sortable/sortable';
import Pagination from 'ZeroComponents/pagination/pagination';
import SearchIcon from 'assets/icons/search';
import CheckIcon from 'assets/icons/check';

const defaultQueryOrder = 'a-z';
/**
 * @typedef {Object} TokensManagerProps
 * @property {object} [content]
 */
/**
 *
 * @param {TokensManagerProps} props
 * @returns
 */
const TokensManager = ({ content }) => {
  const { tokens, fetchDate, isFetchingTokens, deleteToken, getTokens, isCreating } = useTokens();
  const [deletingTokenId, setDeletingTokenId] = useState('');
  const { query, replace } = useRouter();
  const queryClient = useQueryClient();
  const queryOrderRef = useRef(query.order);

  const [filteredTokens, setFilteredTokens] = useState([]);
  const [sortedTokens, setSortedTokens] = useState([]);
  const [paginatedTokens, setPaginatedTokens] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(null);
  const [showCheckOverlay, setShowCheckOverlay] = useState(false);
  const tokenRowLabels = content.table.token_row_labels;

  // Method to reset the pagination every time query order changes
  useEffect(() => {
    if (
      (!queryOrderRef.current && !!query.order && query.order !== defaultQueryOrder) ||
      (!!queryOrderRef.current && !!query.order && query.order !== queryOrderRef.current)
    ) {
      delete query.page;

      replace(
        {
          query,
        },
        undefined,
        { shallow: true }
      );

      const scrollToElement = document.querySelector('.tokens-manager-container');
      scrollToElement?.scrollIntoView(true);

      queryOrderRef.current = query.order;
    }
  }, [query.order, query, replace]);

  const deleteTokenCallback = useCallback(
    async id => {
      if (!window.confirm('Are you sure? Deleted tokens cannot be recovered!')) {
        return;
      }
      setDeletingTokenId(id);

      try {
        await deleteToken(id);
      } finally {
        await queryClient.invalidateQueries('get-tokens');

        countly.trackEvent(countly.events.TOKEN_DELETE, {
          ui: countly.ui.TOKENS,
        });

        await getTokens();
        setDeletingTokenId('');
      }
    },
    [queryClient, deleteToken, setDeletingTokenId, getTokens]
  );

  const showCheckOverlayHandler = useCallback(() => {
    setShowCheckOverlay(true);
    setTimeout(() => {
      setShowCheckOverlay(false);
    }, 500);
  }, [setShowCheckOverlay]);

  return (
    <div className="section tokens-manager-container">
      <div className="tokens-manager-header">
        <h4>{content.heading}</h4>
        <Filterable
          items={tokens}
          icon={<SearchIcon />}
          filterKeys={['name', 'secret']}
          placeholder={content.ui.filter.placeholder}
          queryParam="filter"
          onChange={setFilteredTokens}
        />
        <Sortable
          items={filteredTokens}
          staticLabel={content.ui.sortby.label}
          options={content.ui.sortby.options}
          value={defaultQueryOrder}
          queryParam="order"
          onChange={setSortedTokens}
          onSelectChange={showCheckOverlayHandler}
        />
      </div>
      <TokenRowItem name={tokenRowLabels.name.label} secret={tokenRowLabels.secret.label} isHeader />
      <div className="tokens-manager-table-content">
        {isFetchingTokens || !fetchDate ? (
          <Loading className={'tokens-manager-loading-spinner'} />
        ) : !tokens.length ? (
          <span className="tokens-manager-upload-cta">
            {content.table.message}
            {'\u00A0'}
            <Button
              className={clsx(isCreating && 'isDisabled')}
              href={content.table.cta.link}
              variant={content.table.cta.theme}
              tracking={{ ui: countly.ui[content.table.cta.ui], action: content.table.cta.action }}
            >
              <Link href={content.table.cta.link}>{content.table.cta.text}</Link>
            </Button>
          </span>
        ) : (
          paginatedTokens.map(({ name, secret, _id }) => (
            <TokenRowItem
              key={secret}
              id={_id}
              name={name}
              secret={secret}
              deletingTokenId={deletingTokenId}
              onTokenDelete={() => deleteTokenCallback(_id)}
            />
          ))
        )}
      </div>
      <div className="tokens-manager-footer">
        <Pagination
          items={sortedTokens}
          itemsPerPage={itemsPerPage || 10}
          visiblePages={2}
          queryParam="page"
          onChange={setPaginatedTokens}
          scrollTarget={'.tokens-manager-container'}
        />
        <Dropdown
          className="tokens-manager-result-dropdown"
          value={content.ui.results.options[0].value}
          options={content.ui.results.options}
          queryParam="items"
          onChange={value => setItemsPerPage(value)}
          onSelectChange={showCheckOverlayHandler}
        />
      </div>
      <div className={clsx('files-manager-overlay', showCheckOverlay ? 'show' : '')}>
        <div className="files-manager-overlay-check">
          <CheckIcon></CheckIcon>
        </div>
      </div>
    </div>
  );
};

export default TokensManager;