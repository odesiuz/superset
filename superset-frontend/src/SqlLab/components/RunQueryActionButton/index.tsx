/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { useMemo, FC, ReactElement } from 'react';

import { t, styled, useTheme, SupersetTheme } from '@superset-ui/core';

import { Button, DropdownButton } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import { detectOS } from 'src/utils/common';
import { QueryButtonProps } from 'src/SqlLab/types';
import useQueryEditor from 'src/SqlLab/hooks/useQueryEditor';
import {
  LOG_ACTIONS_SQLLAB_RUN_QUERY,
  LOG_ACTIONS_SQLLAB_STOP_QUERY,
} from 'src/logger/LogUtils';
import useLogAction from 'src/logger/useLogAction';

export interface RunQueryActionButtonProps {
  queryEditorId: string;
  allowAsync: boolean;
  queryState?: string;
  runQuery: (c?: boolean) => void;
  stopQuery: () => void;
  overlayCreateAsMenu: ReactElement | null;
}

const buildText = (
  shouldShowStopButton: boolean,
  selectedText: string | undefined,
  theme: SupersetTheme,
): string | JSX.Element => {
  if (shouldShowStopButton) {
    return (
      <>
        <Icons.Square iconSize="xs" iconColor={theme.colorIcon} />
        {t('Stop')}
      </>
    );
  }
  if (selectedText) {
    return t('Run selection');
  }
  return t('Run');
};

const onClick = (
  shouldShowStopButton: boolean,
  allowAsync: boolean,
  runQuery: (c?: boolean) => void = () => undefined,
  stopQuery = () => {},
  logAction: (name: string, payload: Record<string, any>) => void,
): void => {
  const eventName = shouldShowStopButton
    ? LOG_ACTIONS_SQLLAB_STOP_QUERY
    : LOG_ACTIONS_SQLLAB_RUN_QUERY;

  logAction(eventName, { shortcut: false });
  if (shouldShowStopButton) return stopQuery();
  if (allowAsync) {
    return runQuery(true);
  }
  return runQuery(false);
};

const StyledButton = styled.span`
  button {
    line-height: 13px;
    // this is to over ride a previous transition built into the component
    transition: background-color 0ms;
    &:last-of-type {
      margin-right: ${({ theme }) => theme.sizeUnit * 2}px;
    }
    span[name='caret-down'] {
      display: flex;
      margin-left: ${({ theme }) => theme.sizeUnit * 1}px;
    }
  }
`;

const RunQueryActionButton = ({
  allowAsync = false,
  queryEditorId,
  queryState,
  overlayCreateAsMenu,
  runQuery,
  stopQuery,
}: RunQueryActionButtonProps) => {
  const theme = useTheme();
  const logAction = useLogAction({ queryEditorId });
  const userOS = detectOS();

  const { selectedText, sql } = useQueryEditor(queryEditorId, [
    'selectedText',
    'sql',
  ]);

  const shouldShowStopBtn =
    !!queryState && ['running', 'pending'].indexOf(queryState) > -1;

  const ButtonComponent: FC<QueryButtonProps> = overlayCreateAsMenu
    ? (DropdownButton as FC)
    : Button;

  const sqlContent = selectedText || sql || '';
  const isDisabled = !sqlContent
    ?.replace(/(\/\*[^*]*\*\/)|(\/\/[^*]*)|(--[^.].*)/gm, '')
    .trim();

  const stopButtonTooltipText = useMemo(
    () =>
      userOS === 'MacOS'
        ? t('Stop running (Ctrl + x)')
        : t('Stop running (Ctrl + e)'),
    [userOS],
  );

  return (
    <StyledButton>
      <ButtonComponent
        data-test="run-query-action"
        onClick={() =>
          onClick(shouldShowStopBtn, allowAsync, runQuery, stopQuery, logAction)
        }
        disabled={isDisabled}
        tooltip={
          (!isDisabled &&
            (shouldShowStopBtn
              ? stopButtonTooltipText
              : t('Run query (Ctrl + Return)'))) as string
        }
        cta
        {...(overlayCreateAsMenu
          ? {
              overlay: overlayCreateAsMenu,
              icon: (
                <Icons.DownOutlined
                  iconColor={
                    isDisabled ? theme.colorTextDisabled : theme.colorIcon
                  }
                />
              ),
              trigger: 'click',
            }
          : {
              buttonStyle: shouldShowStopBtn ? 'danger' : 'primary',
            })}
      >
        {buildText(shouldShowStopBtn, selectedText, theme)}
      </ButtonComponent>
    </StyledButton>
  );
};

export default RunQueryActionButton;
